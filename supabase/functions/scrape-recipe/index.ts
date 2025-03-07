
import { serve } from 'https://deno.land/std@0.182.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

interface RecipeData {
  name?: string;
  description?: string;
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  ingredients?: Array<{
    name: string;
    quantity?: number;
    unit?: string;
  }>;
  instructions?: string[];
  imageUrl?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()
    console.log(`Scraping recipe from URL: ${url}`)

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'Missing URL parameter' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Fetch the webpage content
    const response = await fetch(url)
    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch URL: ${response.statusText}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const html = await response.text()
    
    // Try to extract recipe data
    const recipeData: RecipeData = {}

    // Basic extraction of recipe schema data if available
    const schemaMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)
    if (schemaMatch && schemaMatch[1]) {
      try {
        const schemaData = JSON.parse(schemaMatch[1])
        
        // Look for Recipe schema
        const recipeSchema = schemaData['@type'] === 'Recipe' 
          ? schemaData 
          : Array.isArray(schemaData['@graph']) 
            ? schemaData['@graph'].find((item: any) => item['@type'] === 'Recipe') 
            : null

        if (recipeSchema) {
          console.log('Found Recipe schema data')
          
          recipeData.name = recipeSchema.name
          recipeData.description = recipeSchema.description
          
          // Try to parse servings
          if (recipeSchema.recipeYield) {
            const servingsMatch = String(recipeSchema.recipeYield).match(/\d+/)
            if (servingsMatch) {
              recipeData.servings = parseInt(servingsMatch[0], 10)
            }
          }
          
          // Try to parse prep time and cook time
          if (recipeSchema.prepTime) {
            const prepMinutes = parseDuration(recipeSchema.prepTime)
            if (prepMinutes) recipeData.prepTime = prepMinutes
          }
          
          if (recipeSchema.cookTime) {
            const cookMinutes = parseDuration(recipeSchema.cookTime)
            if (cookMinutes) recipeData.cookTime = cookMinutes
          }

          // Extract ingredients
          if (recipeSchema.recipeIngredient && Array.isArray(recipeSchema.recipeIngredient)) {
            recipeData.ingredients = recipeSchema.recipeIngredient.map((ingredient: string) => {
              // Try to parse quantity and unit from ingredient string
              const parsedIngredient = parseIngredient(ingredient)
              return {
                name: parsedIngredient.name || ingredient,
                quantity: parsedIngredient.quantity,
                unit: parsedIngredient.unit
              }
            })
          }

          // Extract instructions
          if (recipeSchema.recipeInstructions) {
            if (Array.isArray(recipeSchema.recipeInstructions)) {
              recipeData.instructions = recipeSchema.recipeInstructions.map((instruction: any) => {
                if (typeof instruction === 'string') return instruction
                return instruction.text || ''
              }).filter(Boolean)
            } else if (typeof recipeSchema.recipeInstructions === 'string') {
              recipeData.instructions = [recipeSchema.recipeInstructions]
            }
          }

          // Extract image
          if (recipeSchema.image) {
            if (typeof recipeSchema.image === 'string') {
              recipeData.imageUrl = recipeSchema.image
            } else if (Array.isArray(recipeSchema.image) && recipeSchema.image.length > 0) {
              recipeData.imageUrl = typeof recipeSchema.image[0] === 'string' 
                ? recipeSchema.image[0] 
                : recipeSchema.image[0].url
            } else if (recipeSchema.image.url) {
              recipeData.imageUrl = recipeSchema.image.url
            }
          }
        }
      } catch (e) {
        console.error('Error parsing schema data:', e)
      }
    }

    // BBC Good Food specific handling - if we didn't get ingredients from schema or need more data
    if (url.includes('bbcgoodfood.com') && (!recipeData.ingredients || recipeData.ingredients.length === 0)) {
      console.log('Attempting BBC Good Food specific extraction')
      
      // Extract ingredients from BBC Good Food HTML structure
      const ingredientSectionMatch = html.match(/<ul class="mntl-structured-ingredients__list">(.*?)<\/ul>/s)
      if (ingredientSectionMatch) {
        const ingredientSection = ingredientSectionMatch[1]
        const ingredientItems = ingredientSection.match(/<li[^>]*>(.*?)<\/li>/sg) || []
        
        recipeData.ingredients = ingredientItems.map(item => {
          // Extract ingredient text from list item
          const ingredientText = item.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
          return parseIngredient(ingredientText)
        })
      }
      
      // Alternative ingredient extraction for BBC Good Food
      if (!recipeData.ingredients || recipeData.ingredients.length === 0) {
        const ingredientItems = html.match(/<li\s+class="[^"]*ingredient[^"]*"[^>]*>(.*?)<\/li>/sg) || []
        
        recipeData.ingredients = ingredientItems.map(item => {
          const ingredientText = item.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
          const parsed = parseIngredient(ingredientText)
          return {
            name: parsed.name || ingredientText,
            quantity: parsed.quantity,
            unit: parsed.unit
          }
        })
      }
      
      // Try to extract instructions if not already found
      if (!recipeData.instructions || recipeData.instructions.length === 0) {
        const methodSectionMatch = html.match(/<div[^>]*class="[^"]*method[^"]*"[^>]*>(.*?)<\/div>/s)
        if (methodSectionMatch) {
          const methodSection = methodSectionMatch[1]
          const methodItems = methodSection.match(/<li[^>]*>(.*?)<\/li>/sg) || []
          
          recipeData.instructions = methodItems.map(item => {
            return item.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
          }).filter(Boolean)
        }
      }
      
      // If we still don't have a name, try to extract it from title
      if (!recipeData.name) {
        const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/s)
        if (titleMatch) {
          recipeData.name = titleMatch[1].replace(/<[^>]*>/g, '').trim()
        }
      }
    }

    // If we didn't find structured data, try some basic parsing
    if (!recipeData.name) {
      // Try to extract title
      const titleMatch = html.match(/<title>(.*?)<\/title>/i)
      if (titleMatch && titleMatch[1]) {
        recipeData.name = titleMatch[1].replace(/\s*[-|]\s*.*$/, '').trim()
      }
    }

    // Log the extracted data for debugging
    console.log('Extracted recipe data:', JSON.stringify(recipeData, null, 2))
    
    return new Response(
      JSON.stringify({ data: recipeData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error scraping recipe:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// Helper function to parse durations like PT1H30M to minutes
function parseDuration(duration: string): number | null {
  if (!duration) return null
  
  try {
    // Handle ISO format like PT1H30M
    if (duration.startsWith('PT')) {
      const hours = duration.match(/(\d+)H/i)
      const minutes = duration.match(/(\d+)M/i)
      
      let totalMinutes = 0
      if (hours) totalMinutes += parseInt(hours[1], 10) * 60
      if (minutes) totalMinutes += parseInt(minutes[1], 10)
      
      return totalMinutes
    }
    
    // Try to parse simple number (assumed to be minutes)
    const simpleNumber = parseInt(duration, 10)
    if (!isNaN(simpleNumber)) return simpleNumber
    
    return null
  } catch {
    return null
  }
}

// Helper function to try to extract quantity, unit, and name from an ingredient string
function parseIngredient(ingredient: string): { quantity?: number, unit?: string, name?: string } {
  const result: { quantity?: number, unit?: string, name?: string } = {}
  
  // Common units
  const units = [
    'cup', 'cups', 'tbsp', 'tablespoon', 'tablespoons', 'tsp', 'teaspoon', 'teaspoons',
    'oz', 'ounce', 'ounces', 'lb', 'pound', 'pounds', 'g', 'gram', 'grams', 'kg',
    'ml', 'milliliter', 'milliliters', 'l', 'liter', 'liters', 'pinch', 'dash'
  ]
  
  // Regex to match quantity (including fractions like 1/2) and optional unit
  const regex = new RegExp(
    `^\\s*(\\d+(?:\\s*\\d+)?(?:\\s*\\/\\s*\\d+)?|(?:\\d+)?\\.\\d+)\\s*(${units.join('|')})?\\s+(.*)`, 'i'
  )
  
  const match = ingredient.match(regex)
  
  if (match) {
    // Parse quantity which could be a fraction like "1/2" or a mixed number like "1 1/2"
    try {
      let quantityStr = match[1].trim()
      
      // Handle mixed numbers like "1 1/2"
      if (quantityStr.includes(' ')) {
        const parts = quantityStr.split(' ')
        const whole = parseFloat(parts[0])
        const fracParts = parts[1].split('/')
        const frac = parseFloat(fracParts[0]) / parseFloat(fracParts[1])
        result.quantity = whole + frac
      }
      // Handle simple fractions like "1/2"
      else if (quantityStr.includes('/')) {
        const parts = quantityStr.split('/')
        result.quantity = parseFloat(parts[0]) / parseFloat(parts[1])
      }
      // Handle decimal numbers
      else {
        result.quantity = parseFloat(quantityStr)
      }
    } catch (e) {
      console.error('Error parsing quantity:', e)
    }
    
    // Get unit if available
    if (match[2]) {
      result.unit = match[2].trim()
    }
    
    // Get ingredient name
    result.name = match[3].trim()
  } else {
    // If regex didn't match, use the whole string as the name
    result.name = ingredient.trim()
  }
  
  return result
}
