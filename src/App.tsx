
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useFrameProcessor,
} from 'react-native-vision-camera';
import { request, PERMISSIONS, check, RESULTS } from 'react-native-permissions';
import {
  DetectedObject,
  detectObjects,
  FrameProcessorConfig,
} from 'vision-camera-realtime-object-detection';
import { runOnJS } from 'react-native-reanimated';

const NoCameraDeviceError = () => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorText}>No camera device available</Text>
  </View>
);

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#363636',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  detectionFrame: {
    position: 'absolute',
    borderColor: 'red',
    borderWidth: 2,
  },
  detectionFrameLabel: {
    color: 'red',
  },
});

const requestCameraPermission = async () => {
  const permissionStatus = await check(PERMISSIONS.ANDROID.CAMERA);

  if (permissionStatus === RESULTS.GRANTED) {
    // Camera permission already granted
  } else {
    const requestStatus = await request(PERMISSIONS.ANDROID.CAMERA);
    if (requestStatus === RESULTS.GRANTED) {
      // Camera permission granted
    } else {
      // Camera permission denied
    }
  }
};

const App = () => {
  const windowDimensions = useWindowDimensions();
  const device = useCameraDevice('back')
  const [objects, setObjects] = useState<DetectedObject[]>([]);

  const frameProcessorConfig: FrameProcessorConfig = {
    modelFile: 'model_unquant.tflite',
  };

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';

    const detectedObjects = detectObjects(frame, frameProcessorConfig);
    runOnJS(setObjects)(
      detectedObjects.map((obj) => ({
        ...obj,
        top: obj.top * windowDimensions.height,
        left: obj.left * windowDimensions.width,
        width: obj.width * windowDimensions.width,
        height: obj.height * windowDimensions.height,
      }))
    );
  }, []);

  useEffect(() => {
    requestCameraPermission();
  }, []); // Request permission when the component mounts

  if (device == null) return <NoCameraDeviceError />;
  return (
    <View style={StyleSheet.absoluteFill}>
      <Camera
        fps={5}
        frameProcessor={frameProcessor}
        style={{ flex: 1, width: '100%' }}
        device={device}
        isActive={true}
      />
      {objects?.map(
        (
          { top, left, width, height, labels }: DetectedObject,
          index: number
        ) => (
          <View
            key={`${index}`}
            style={[styles.detectionFrame, { top, left, width, height }]}
          >
            <Text style={styles.detectionFrameLabel}>
              {labels
                .map((label) => `${label.label} (${label.confidence})`)
                .join(',')}
            </Text>
          </View>
        )
      )}
    </View>
  );
};

export default App;
