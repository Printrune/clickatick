/* MediaPipe Tasks Vision 0.10.32, Apache-2.0. See frontend/avatar-capture-v1.md. */
const ROOT='https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32';
const MODEL='https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
self.onmessage=async({data})=>{
  let model;
  try{
    const {FilesetResolver,FaceLandmarker}=await import(`${ROOT}/vision_bundle.mjs`);
    const files=await FilesetResolver.forVisionTasks(`${ROOT}/wasm`);
    model=await FaceLandmarker.createFromOptions(files,{
      baseOptions:{modelAssetPath:MODEL,delegate:'CPU'},runningMode:'IMAGE',numFaces:1,
      minFaceDetectionConfidence:.6,minFacePresenceConfidence:.6,
      outputFaceBlendshapes:false,outputFacialTransformationMatrixes:false,
    });
    if(data.type==='initialize'){self.postMessage({ready:true});return;}
    const landmarks=model.detect(data.bitmap).faceLandmarks?.[0];
    self.postMessage(landmarks?.length?{landmarks}:{error:'no-face'});
  }catch{self.postMessage({error:'unavailable'});}
  finally{data.bitmap?.close();model?.close();self.close();}
};
