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
    const { url, useAI = true } = await req.json()
    console.log(`Scraping recipe from URL: ${url} ${useAI ? 'with AI assistance' : 'without AI'}`)

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
    
    let recipeData: RecipeData = {}

    // Try AI-powered extraction if enabled and OpenAI API key is available
    if (useAI) {
      try {
        const openAIKey = Deno.env.get('OPENAI_API_KEY')
        if (openAIKey) {
          console.log('Attempting AI-powered recipe extraction')
          const aiExtractedData = await extractRecipeWithAI(html, url, openAIKey)
          
          if (aiExtractedData) {
            console.log('Successfully extracted recipe data with AI')
            
            // Deduplicate ingredients
            if (aiExtractedData.ingredients && aiExtractedData.ingredients.length > 0) {
              aiExtractedData.ingredients = deduplicateIngredients(aiExtractedData.ingredients)
            }
            
            return new Response(
              JSON.stringify({ data: aiExtractedData }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        } else {
          console.log('OpenAI API key not found, falling back to regular extraction')
        }
      } catch (error) {
        console.error('Error using AI extraction:', error)
        console.log('Falling back to regular extraction')
      }
    }
    
    // Fall back to regular extraction methods if AI failed or was disabled
    // Try to extract recipe data using structured data and HTML parsing
    recipeData = await extractRecipeDataTraditional(html, url)
    
    // Deduplicate ingredients
    if (recipeData.ingredients && recipeData.ingredients.length > 0) {
      recipeData.ingredients = deduplicateIngredients(recipeData.ingredients)
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

// Use OpenAI to extract recipe data from HTML
async function extractRecipeWithAI(html: string, url: string, apiKey: string): Promise<RecipeData> {
  // Clean up the HTML to reduce token size
  const cleanedHtml = cleanHtmlForAI(html)
  
  // Create a prompt for the AI
  const prompt = `
You are a helpful assistant that extracts recipe information from HTML.
Extract the following information from this recipe webpage HTML:
1. Recipe name/title
2. Description
3. Number of servings
4. Preparation time in minutes
5. Cooking time in minutes
6. List of ingredients with quantities and units
7. Step-by-step instructions
8. Image URL (if available)

HTML from ${url}:
${cleanedHtml}

Return the data in valid JSON format:
{
  "name": "Recipe Name",
  "description": "Brief description",
  "servings": 4,
  "prepTime": 15,
  "cookTime": 30,
  "ingredients": [
    {
      "name": "ingredient name",
      "quantity": 1.5,
      "unit": "cups"
    }
  ],
  "instructions": [
    "Step 1 instruction",
    "Step 2 instruction"
  ],
  "imageUrl": "https://example.com/image.jpg"
}
`

  // Call OpenAI API
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a recipe extraction assistant. Extract recipe details accurately from HTML.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    console.error('OpenAI API error:', errorData)
    throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`)
  }

  const data = await response.json()
  const extractedText = data.choices[0].message.content

  try {
    // Extract JSON from the response
    const jsonMatch = extractedText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const recipeData = JSON.parse(jsonMatch[0])
      return recipeData
    } else {
      throw new Error('No valid JSON found in AI response')
    }
  } catch (error) {
    console.error('Error parsing AI response:', error)
    console.log('AI response:', extractedText)
    throw new Error('Failed to parse recipe data from AI response')
  }
}

// Clean HTML to reduce token size for AI
function cleanHtmlForAI(html: string): string {
  // Focus on the most relevant parts of the HTML
  let cleanedHtml = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')    // Remove styles
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')          // Remove SVGs
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '') // Remove footer
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '') // Remove header
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')          // Remove nav
    .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, '')    // Remove aside
    .replace(/<!--[\s\S]*?-->/g, '')                                   // Remove comments
  
  // Look for recipe-specific sections to keep
  const recipeSection = cleanedHtml.match(/<div[^>]*class="[^"]*recipe[^"]*"[^>]*>[\s\S]*?<\/div>/i) ||
                       cleanedHtml.match(/<section[^>]*class="[^"]*recipe[^"]*"[^>]*>[\s\S]*?<\/section>/i) ||
                       cleanedHtml.match(/<article[^>]*class="[^"]*recipe[^"]*"[^>]*>[\s\S]*?<\/article>/i)
  
  if (recipeSection) {
    cleanedHtml = recipeSection[0]
  } else {
    // Extract just the main content if possible
    const mainContent = cleanedHtml.match(/<main[^>]*>[\s\S]*?<\/main>/i) ||
                       cleanedHtml.match(/<article[^>]*>[\s\S]*?<\/article>/i) ||
                       cleanedHtml.match(/<div[^>]*id="content"[^>]*>[\s\S]*?<\/div>/i) ||
                       cleanedHtml.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>[\s\S]*?<\/div>/i)
    
    if (mainContent) {
      cleanedHtml = mainContent[0]
    }
  }
  
  // Look for JSON-LD structured data which often contains recipe information
  const jsonLdMatch = html.match(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/i)
  if (jsonLdMatch && jsonLdMatch[1]) {
    cleanedHtml = `${cleanedHtml}\n\nJSON-LD Data: ${jsonLdMatch[1]}`
  }
  
  // Truncate if still too large
  const MAX_LENGTH = 15000
  if (cleanedHtml.length > MAX_LENGTH) {
    cleanedHtml = cleanedHtml.substring(0, MAX_LENGTH) + '...[truncated]'
  }
  
  return cleanedHtml
}

// Function to deduplicate ingredients based on similar names
function deduplicateIngredients(ingredients: Array<{ name: string; quantity?: number; unit?: string }>): Array<{ name: string; quantity?: number; unit?: string }> {
  const uniqueIngredients: Array<{ name: string; quantity?: number; unit?: string }> = []
  const nameMap = new Map<string, number>() // Maps normalized names to their index in uniqueIngredients
  
  for (const ingredient of ingredients) {
    if (!ingredient.name) continue
    
    // Normalize the ingredient name to compare similarity
    const normalizedName = normalizeIngredientName(ingredient.name)
    
    // Check if we already have a similar ingredient
    let foundSimilar = false
    for (const [existingNormalized, index] of nameMap.entries()) {
      if (areSimilarIngredients(normalizedName, existingNormalized)) {
        // If units match or both are missing, combine quantities
        if (ingredient.unit === uniqueIngredients[index].unit ||
            (!ingredient.unit && !uniqueIngredients[index].unit)) {
          if (ingredient.quantity && uniqueIngredients[index].quantity) {
            uniqueIngredients[index].quantity += ingredient.quantity
          }
        } else {
          // If units don't match, keep the more detailed name but don't add quantities
          if (ingredient.name.length > uniqueIngredients[index].name.length) {
            uniqueIngredients[index].name = ingredient.name
          }
        }
        foundSimilar = true
        break
      }
    }
    
    // If no similar ingredient was found, add this one
    if (!foundSimilar) {
      nameMap.set(normalizedName, uniqueIngredients.length)
      uniqueIngredients.push({...ingredient})
    }
  }
  
  return uniqueIngredients
}

// Normalize ingredient name for comparison
function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ')    // Replace multiple spaces with a single space
    .trim()                 // Trim whitespace
    .replace(/\b(diced|chopped|minced|sliced|grated|cubed|crushed|ground|whole|fresh|dried)\b/g, '') // Remove common prep words
    .replace(/\s+/g, ' ')   // Clean up spaces again
    .trim()
}

// Check if two normalized ingredient names are similar
function areSimilarIngredients(name1: string, name2: string): boolean {
  // Exact match
  if (name1 === name2) return true
  
  // One is a substring of the other
  if (name1.includes(name2) || name2.includes(name1)) return true
  
  // Calculate similarity score
  const longerName = name1.length > name2.length ? name1 : name2
  const shorterName = name1.length > name2.length ? name2 : name1
  
  // If shorter name is very short, be more strict with matching
  if (shorterName.length <= 3) return false
  
  // Check for word-level similarity
  const words1 = name1.split(' ')
  const words2 = name2.split(' ')
  
  // Count matching words
  const matchingWords = words1.filter(word => words2.includes(word)).length
  
  // If at least one word matches and it's a significant word
  if (matchingWords > 0 && 
      (matchingWords / Math.max(words1.length, words2.length) > 0.5 || 
       matchingWords / Math.min(words1.length, words2.length) > 0.7)) {
    return true
  }
  
  return false
}

// Traditional extraction method using structured data and HTML parsing
async function extractRecipeDataTraditional(html: string, url: string): Promise<RecipeData> {
  // Try to extract recipe data
  const recipeData: RecipeData = {}

  // Try to find all JSON-LD scripts
  const jsonLdScripts = html.match(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/g) || []
  
  // Process each JSON-LD script
  let foundRecipeSchema = false
  
  for (const scriptTag of jsonLdScripts) {
    const scriptContent = scriptTag.match(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/)
    
    if (scriptContent && scriptContent[1]) {
      try {
        const schemaData = JSON.parse(scriptContent[1])
        
        // Look for Recipe schema
        const recipeSchema = schemaData['@type'] === 'Recipe' 
          ? schemaData 
          : Array.isArray(schemaData['@graph']) 
            ? schemaData['@graph'].find((item: any) => item['@type'] === 'Recipe') 
            : null

        if (recipeSchema) {
          console.log('Found Recipe schema data')
          foundRecipeSchema = true
          
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
                if (instruction['@type'] === 'HowToStep') return instruction.text || ''
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
          
          // If we found a complete recipe schema, break out of the loop
          if (recipeData.name && recipeData.ingredients && recipeData.ingredients.length > 0) {
            break
          }
        }
      } catch (e) {
        console.error('Error parsing schema data:', e)
      }
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

  // Generic extraction for sites like joyfoodsunshine.com
  if (!recipeData.ingredients || recipeData.ingredients.length === 0) {
    console.log('Attempting generic extraction for ingredients')
    
    // Look for common ingredient containers and lists
    const potentialIngredientSections = [
      // Common class patterns
      html.match(/<ul[^>]*class="[^"]*ingredients[^"]*"[^>]*>([\s\S]*?)<\/ul>/i),
      html.match(/<div[^>]*class="[^"]*ingredients[^"]*"[^>]*>([\s\S]*?)<\/div>/i),
      html.match(/<section[^>]*class="[^"]*ingredients[^"]*"[^>]*>([\s\S]*?)<\/section>/i),
      
      // WPRM (WordPress Recipe Maker) specific
      html.match(/<ul[^>]*class="[^"]*wprm-recipe-ingredients[^"]*"[^>]*>([\s\S]*?)<\/ul>/i),
      
      // Tasty Recipes specific
      html.match(/<ul[^>]*class="[^"]*tasty-recipes-ingredients[^"]*"[^>]*>([\s\S]*?)<\/ul>/i),
    ].filter(Boolean)
    
    for (const section of potentialIngredientSections) {
      if (section && section[1]) {
        const ingredientSection = section[1]
        const ingredientItems = ingredientSection.match(/<li[^>]*>([\s\S]*?)<\/li>/g) || []
        
        if (ingredientItems.length > 0) {
          recipeData.ingredients = ingredientItems.map(item => {
            // Extract ingredient text from list item
            const ingredientText = item.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
            return parseIngredient(ingredientText)
          })
          
          console.log(`Found ${recipeData.ingredients.length} ingredients`)
          break
        }
      }
    }
  }
  
  // Generic extraction for instructions
  if (!recipeData.instructions || recipeData.instructions.length === 0) {
    console.log('Attempting generic extraction for instructions')
    
    // Look for common instruction containers and lists
    const potentialInstructionSections = [
      // Common class patterns
      html.match(/<ol[^>]*class="[^"]*instructions[^"]*"[^>]*>([\s\S]*?)<\/ol>/i),
      html.match(/<div[^>]*class="[^"]*instructions[^"]*"[^>]*>([\s\S]*?)<\/div>/i),
      html.match(/<section[^>]*class="[^"]*instructions[^"]*"[^>]*>([\s\S]*?)<\/section>/i),
      
      // WPRM (WordPress Recipe Maker) specific
      html.match(/<ol[^>]*class="[^"]*wprm-recipe-instructions[^"]*"[^>]*>([\s\S]*?)<\/ol>/i),
      html.match(/<ul[^>]*class="[^"]*wprm-recipe-instructions[^"]*"[^>]*>([\s\S]*?)<\/ul>/i),
      
      // Tasty Recipes specific
      html.match(/<ol[^>]*class="[^"]*tasty-recipes-instructions[^"]*"[^>]*>([\s\S]*?)<\/ol>/i),
      
      // Method specific
      html.match(/<ol[^>]*class="[^"]*method[^"]*"[^>]*>([\s\S]*?)<\/ol>/i),
      html.match(/<div[^>]*class="[^"]*method[^"]*"[^>]*>([\s\S]*?)<\/div>/i),
    ].filter(Boolean)
    
    for (const section of potentialInstructionSections) {
      if (section && section[1]) {
        const instructionSection = section[1]
        const instructionItems = instructionSection.match(/<li[^>]*>([\s\S]*?)<\/li>/g) || []
        
        if (instructionItems.length > 0) {
          recipeData.instructions = instructionItems.map(item => {
            return item.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
          }).filter(Boolean)
          
          console.log(`Found ${recipeData.instructions.length} instructions`)
          break
        }
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

  return recipeData
}

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

