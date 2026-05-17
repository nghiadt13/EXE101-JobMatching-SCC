import { Composition } from "remotion";
import { DemoVideo } from "./DemoVideo";

// 30fps, ~46s total = 1380 frames
// With transitions overlap it will be slightly less
export const RemotionRoot = () => {
  return (
    <Composition
      id="DemoVideo"
      component={DemoVideo}
      durationInFrames={1665}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
