const Jimp = require('jimp');
const inquirer = require('inquirer');
const fs = require('fs');

const addTextWatermarkToImage = async function(inputFile, outputFile, text) {
  try{
  const image = await Jimp.read(inputFile);
  const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
  const textData = {
    text,
    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
    alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
  };

  image.print(font, 0, 0, textData, image.getWidth(), image.getHeight());
  await image.quality(100).writeAsync(outputFile);
  }
  catch(error){
    error && console.log('Something went wrong... Try again!');
  }
};

const addImageWatermarkToImage = async function(inputFile, outputFile, watermarkFile) {
  try{
  const image = await Jimp.read(inputFile);
  const watermark = await Jimp.read(watermarkFile);
  const x = image.getWidth() / 2 - watermark.getWidth() / 2;
  const y = image.getHeight() / 2 - watermark.getHeight() / 2;

  image.composite(watermark, x, y, {
    mode: Jimp.BLEND_SOURCE_OVER,
    opacitySource: 0.5,
  });
  await image.quality(100).writeAsync(outputFile);
  }
  catch(error){
    error && console.log('Something went wrong... Try again!');
  }
};

const prepareOutputFilename = (filename) => {
  const [name, ext] = filename.split('.');
  return name + '-with-watermark.' + ext;
};
//image manipulation functions
const adjustBrightness = async function (inputFile, val){
  try{
    const image = await Jimp.read(inputFile);
    val = parseFloat(val);
    val = val < -1 ? -1 : val > 1 ? 1 : val;
    await image.brightness( val );
    await image.writeAsync(inputFile); 
  }
  catch(error){
    error && console.log('Something went wrong... Try again!');
  }
}

const adjustConstrast = async function (inputFile, val){
  try{
    const image = await Jimp.read(inputFile);
    val = parseFloat(val);
    val = val < -1 ? -1 : val > 1 ? 1 : val;
    await image.contrast( val );
    await image.writeAsync(inputFile); 
  }
  catch(error){
    error && console.log('Something went wrong... Try again!');
  }
}

const greyscale = async function (inputFile){
  try{
    const image = await Jimp.read(inputFile);    
    await image.greyscale();
    await image.writeAsync(inputFile); 
  }
  catch(error){
    error && console.log('Something went wrong... Try again!');
  }
}

const invert = async function (inputFile){
  try{
    const image = await Jimp.read(inputFile);    
    await image.mirror(true, true);
    await image.writeAsync(inputFile); 
  }
  catch(error){
    error && console.log('Something went wrong... Try again!');
  }
}

const startApp = async () => {

  // Ask if user is ready
  const answer = await inquirer.prompt([{
      name: 'start',
      message: 'Hi! Welcome to "Watermark manager". Copy your image files to `/img` folder. Then you\'ll be able to use them in the app. Are you ready?',
      type: 'confirm'
    }]); 
  // if answer is no, just quit the app
  if(!answer.start) process.exit();

  // ask about input file
    const options = await inquirer.prompt({
      name: 'inputImage',
      type: 'input',
      message: 'What file do you want to mark?',
      default: 'test.jpg',
    });
  // ask about changes in file
  if(fs.existsSync('./img/' + options.inputImage)){
    const file = './img/' + options.inputImage;
    const changes = await inquirer.prompt([{
      name: 'confirmChanges',      
      message: 'Do yo want to edit file before apply watermark?',
      type: 'confirm',
    },
    {
      name: 'changeType',
      type: 'list',
      choices: ['adjust brightness', 'adjust contrast', 'make image b&w', 'invert image'],
    }]);

    if(changes.confirmChanges){
      //apply changes acording to chosen option
      switch(changes.changeType){
        case 'adjust brightness':
          {
          const val = await inquirer.prompt([{
            name: 'value',
            type: 'input',
            message: 'Type your value between -1 (max dark) and 1 ( max bright)',
          }]);         
          adjustBrightness(file, val.value) && console.log(`Changes: ${changes.changeType} applied!`);   
          }       
          break;          
        case 'adjust contrast':
          {
          const val = await inquirer.prompt([{
            name: 'value',
            type: 'input',
            message: 'Type your value between -1 (min) and 1 (max)',
          }]);          
          adjustConstrast(file, val.value) && console.log(`Changes: ${changes.changeType} applied!`);   
          }       
          break;          
        case 'make image b&w':          
          greyscale(file) && console.log(`Changes: ${changes.changeType} applied!`);          
          break;          
        case 'invert image':          
          invert(file) && console.log(`Changes: ${changes.changeType} applied!`);          
          break;          
      }
    }
  }else{
    console.log('Sorry! ');
    console.log('Cant find: ', './img/' + options.inputImage);
    startApp();
  } 

  const watermark = await inquirer.prompt({    
    name: 'watermarkType',
    type: 'list',
    choices: ['Text watermark', 'Image watermark'],
  });

  if(watermark.watermarkType === 'Text watermark') {
    const text = await inquirer.prompt([{
      name: 'value',
      type: 'input',
      message: 'Type your watermark text:',
    }]);
    options.watermarkText = text.value;
    if(fs.existsSync('./img/' + options.inputImage)){
      addTextWatermarkToImage('./img/' + options.inputImage, './img/' + prepareOutputFilename(options.inputImage), options.watermarkText) && console.log('Success!');
      startApp();
    }else{
      console.log('Sorry! ');
      console.log('Cant find: ', './img/' + options.inputImage);
      startApp();
    }
  }
  else {
    const image = await inquirer.prompt([{
      name: 'filename',
      type: 'input',
      message: 'Type your watermark name:',
      default: 'logo.png',
    }]);
    options.watermarkImage = image.filename;
    if(fs.existsSync('./img/' + options.inputImage) && fs.existsSync('./img/' + options.watermarkImage)){
      addImageWatermarkToImage('./img/' + options.inputImage, './img/' + prepareOutputFilename(options.inputImage), './img/' + options.watermarkImage) && console.log('Success!');
      startApp();
    }else{
      console.log('Sorry! ');
      !fs.existsSync('./img/' + options.inputImage) && console.log('Cant find: ', './img/' + options.inputImage);
      !fs.existsSync('./img/' + options.watermarkImage) && console.log('Cant find: ', './img/' + options.watermarkImage);
      startApp();
    }
  }
}

startApp();