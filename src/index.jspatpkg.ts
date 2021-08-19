import audioContext from "./objects/audioContext";
import audioWorklet from "./objects/audioWorklet";
import AnyNode from "./objects/AnyNode";
import Constant from "./objects/Constant";
import Oscillator from "./objects/Oscillator";
import Destination from "./objects/Destination";
import Splitter from "./objects/Splitter";
import Merger from "./objects/Merger";
import Gain from "./objects/Gain";
import Analyser from "./objects/Analyser";
import Biquad from "./objects/Biquad";
import Convolver from "./objects/Convolver";
import Delay from "./objects/Delay";
import Compressor from "./objects/Compressor";
import IIRFilter from "./objects/IIRFilter";
import Media from "./objects/Media";
import StreamDest from "./objects/StreamDestination";
import StreamSrc from "./objects/StreamSource";
import Panner from "./objects/Panner";
import StereoPanner from "./objects/StereoPanner";
import WaveShaper from "./objects/WaveShaper";
import AudioIn from "./objects/AudioIn";
import AudioOut from "./objects/AudioOut";
import BufferSrc from "./objects/BufferSource";

export default async () => ({
    audioContext,
    audioWorklet,
    "node~": AnyNode,
    "constant~": Constant,
    "oscillator~": Oscillator,
    "gain~": Gain,
    "destination~": Destination,
    "splitter~": Splitter,
    "merger~": Merger,
    "analyser~": Analyser,
    "biquad~": Biquad,
    "convolver~": Convolver,
    "delay~": Delay,
    "compressor~": Compressor,
    "iir~": IIRFilter,
    "media~": Media,
    "streamdest~": StreamDest,
    "streamsrc~": StreamSrc,
    "panner~": Panner,
    "pan~": StereoPanner,
    "waveshaper~": WaveShaper,
    "audioIn~": AudioIn,
    "audioOut~": AudioOut,
    "plugin~": Plugin,
    "buffer~": Buffer,
    "bufferSource~": BufferSrc,
});