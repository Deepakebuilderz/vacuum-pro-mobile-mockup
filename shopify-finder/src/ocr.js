import {createWorker} from 'tesseract.js';
export async function recognize(file, workerPath, progress) {
  const worker=await createWorker('eng',1,{workerPath,logger:message=>{if(message.status==='recognizing text')progress(Math.round(message.progress*100));}});
  try {return (await worker.recognize(file)).data.text;}
  finally {await worker.terminate();}
}
