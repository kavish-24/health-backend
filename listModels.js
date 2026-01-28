import dotenv from "dotenv";

dotenv.config();

async function listModels() {
  try {
    console.log("Fetching available models...\n");
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    );
    
    const data = await response.json();
    
    if (data.models) {
      console.log("Available models that support generateContent:\n");
      data.models
        .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
        .forEach(model => {
          console.log(`✓ ${model.name.replace('models/', '')}`);
          console.log(`  Display: ${model.displayName}`);
          console.log(`  Methods: ${model.supportedGenerationMethods.join(', ')}\n`);
        });
    } else {
      console.log("Response:", data);
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

listModels();
