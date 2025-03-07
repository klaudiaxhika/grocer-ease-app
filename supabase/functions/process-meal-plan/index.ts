
import { serve } from "https://deno.land/std@0.182.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import * as pdfjs from "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/+esm";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Check if the request is multipart/form-data
    const contentType = req.headers.get('content-type') || '';
    
    let mealPlanText = '';
    let pdfBuffer = null;
    
    // Handle both multipart/form-data and application/json
    if (contentType.includes('multipart/form-data')) {
      try {
        const formData = await req.formData();
        mealPlanText = formData.get('mealPlanText')?.toString() || '';
        const pdfFile = formData.get('pdfFile') as File | null;
        
        // If a PDF file is provided, extract its text
        if (pdfFile) {
          try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            pdfBuffer = arrayBuffer;
          } catch (error) {
            console.error('Error reading PDF file:', error);
          }
        }
      } catch (error) {
        console.error('Error parsing form data:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to parse form data' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    } else if (contentType.includes('application/json')) {
      const json = await req.json();
      mealPlanText = json.mealPlanText || '';
    } else {
      return new Response(
        JSON.stringify({ error: 'Unsupported content type' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Process PDF if provided
    if (pdfBuffer) {
      try {
        const pdf = await pdfjs.getDocument({ data: pdfBuffer }).promise;
        const numPages = pdf.numPages;
        
        let extractedText = '';
        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          extractedText += pageText + '\n';
        }
        
        mealPlanText = extractedText;
      } catch (error) {
        console.error('Error parsing PDF:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to parse PDF file' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    }

    if (!mealPlanText) {
      return new Response(
        JSON.stringify({ error: 'No meal plan text or PDF provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Processing meal plan text of length:', mealPlanText.length);
    
    // Call OpenAI to extract structured meal plan data
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `You are a helpful assistant that extracts structured meal plan data from text.
                      Extract all recipes mentioned in the meal plan, with their ingredients, instructions, 
                      and associated meal times (breakfast, lunch, dinner, etc.) and dates if mentioned.` 
          },
          { 
            role: 'user', 
            content: `Extract the meal plan data from the following text and return it as JSON:
                      ${mealPlanText}
                      
                      Return the output in this exact format:
                      {
                        "mealPlan": [
                          {
                            "date": "YYYY-MM-DD", // ISO string format, or null if not mentioned
                            "mealType": "breakfast|lunch|dinner|snack", // Type of meal, default to dinner if unclear
                            "recipe": {
                              "name": "Recipe name",
                              "description": "Brief description if available",
                              "ingredients": [
                                {
                                  "name": "Ingredient name",
                                  "quantity": 1, // Number if mentioned, otherwise 1
                                  "unit": "unit of measurement" // If mentioned, otherwise empty string
                                }
                              ],
                              "instructions": ["Step 1", "Step 2", ...],
                              "servings": 2, // Number if mentioned, otherwise 2
                              "prepTime": 15, // Minutes if mentioned, otherwise null
                              "cookTime": 30 // Minutes if mentioned, otherwise null
                            }
                          }
                        ]
                      }
                      
                      Only include recipes that are clearly mentioned with ingredients.
                      For simple items like "coffee" without specific recipe details, just include the name.`
          }
        ],
        temperature: 0.2,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const aiResponseText = data.choices[0].message.content;
    
    // Extract the JSON from the response text
    let mealPlanData;
    try {
      // Look for JSON object in the response
      const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        mealPlanData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in AI response');
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.log('AI response:', aiResponseText);
      return new Response(
        JSON.stringify({ error: 'Failed to parse meal plan data from AI response' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify(mealPlanData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing meal plan:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
