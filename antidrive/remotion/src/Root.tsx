import React from 'react';
import {Composition} from 'remotion';
import {Clip} from './Clip';
import {CLIPS} from './clips';

// 960x600, 30 fps, 6 s loops. One composition per feature group.
export const Root: React.FC = () => (
  <>
    {CLIPS.map((c) => (
      <Composition key={c.id} id={c.id} component={Clip} durationInFrames={180} fps={30} width={960} height={600} defaultProps={{clip: c}} />
    ))}
  </>
);
