
import { serve } from "https://deno.land/std@0.182.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

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

    const { mealPlanText } = await req.json();
    
    if (!mealPlanText) {
      return new Response(
        JSON.stringify({ error: 'No meal plan text provided' }),
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
                            "date": "YYYY-MM-DD", // Date if mentioned, otherwise null
                            "mealType": "breakfast|lunch|dinner|snack", // Type of meal
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
      JSON.stringify({ data: mealPlanData }),
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
