require('dotenv').config();
const { Ollama } = require('ollama');

async function testOllama() {
  console.log('Testing Ollama connection...\n');
  
  const ollama = new Ollama({
    host: process.env.OLLAMA_HOST || 'http://localhost:11434'
  });
  
  const model = process.env.OLLAMA_MODEL || 'deepseek-r1:1.5b';
  
  console.log(`Host: ${process.env.OLLAMA_HOST}`);
  console.log(`Model: ${model}\n`);
  
  try {
    // Test simple chat
    console.log('Sending test message to AI...');
    const response = await ollama.chat({
      model: model,
      messages: [
        {
          role: 'user',
          content: 'Hello! Can you respond with just "AI is working!" to confirm you are functioning?'
        }
      ],
      options: {
        temperature: 0.3,
        num_predict: 50
      }
    });

    console.log('✅ Success! AI Response:');
    console.log(response.message.content);
    console.log('\n🎉 Ollama is working correctly!');
    
  } catch (error) {
    console.error('❌ Error testing Ollama:');
    console.error('Error message:', error.message);
    
    if (error.message.includes('connect ECONNREFUSED')) {
      console.log('\n💡 Solution: Make sure Ollama is running with: ollama serve');
    } else if (error.message.includes('model not found')) {
      console.log('\n💡 Solution: Make sure the model is installed with: ollama pull deepseek-r1:1.5b');
    }
  }
}

testOllama().catch(console.error);