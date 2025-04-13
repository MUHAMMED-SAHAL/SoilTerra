export const preprocessImage = async (imageFile, format = 'NHWC') => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 224;
        canvas.height = 224;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 224, 224);
        
        const imageData = ctx.getImageData(0, 0, 224, 224);
        const data = new Float32Array(1 * 224 * 224 * 3);
        
        if (format === 'NHWC') {
          // Format: [batch, height, width, channels]
          for (let y = 0; y < 224; y++) {
            for (let x = 0; x < 224; x++) {
              const pixelIndex = (y * 224 + x) * 4;
              const outputIndex = (y * 224 + x) * 3;
              data[outputIndex] = imageData.data[pixelIndex] / 255.0;
              data[outputIndex + 1] = imageData.data[pixelIndex + 1] / 255.0;
              data[outputIndex + 2] = imageData.data[pixelIndex + 2] / 255.0;
            }
          }
        } else {
          // Format: [batch, channels, height, width]
          for (let y = 0; 224 > y; y++) {
            for (let x = 0; 224 > x; x++) {
              const pixelIndex = (y * 224 + x) * 4;
              for (let c = 0; 3 > c; c++) {
                data[c * 224 * 224 + y * 224 + x] = imageData.data[pixelIndex + c] / 255.0;
              }
            }
          }
        }
        
        // Validate data
        const hasValidRange = data.every(val => val >= 0 && val <= 1);
        if (!hasValidRange) {
          reject(new Error('Invalid pixel values detected'));
          return;
        }
        
        console.log('Format:', format);
        console.log('Preprocessed image shape:', 
          format === 'NHWC' ? [1, 224, 224, 3] : [1, 3, 224, 224]);
        console.log('First few values:', data.slice(0, 10));
        
        resolve(data);
      };
      img.onerror = (error) => reject(new Error('Error loading image: ' + error.message));
      img.src = e.target.result;
    };
    reader.onerror = (error) => reject(new Error('Error reading file: ' + error.message));
    reader.readAsDataURL(imageFile);
  });
};