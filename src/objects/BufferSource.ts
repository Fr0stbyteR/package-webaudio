import WebAudioObject from "./base";
import { Bang, isBang, PatcherAudio } from "../sdk";
import { decodeLine } from "@jspatcher/jspatcher/src/utils/utils";
import type { IInletsMeta, IOutletsMeta, IPropsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";
import type { TBPF } from "@jspatcher/jspatcher/src/core/types";

type I = [Bang | boolean | number | PatcherAudio | AudioBuffer, TBPF, TBPF, boolean, number, number];
interface P extends Omit<Required<AudioBufferSourceOptions>, "buffer"> {}
interface S {
    node: AudioBufferSourceNode;
    playing: boolean;
}

export default class BufferSrc extends WebAudioObject<AudioBufferSourceNode, S, I, [null, Bang, AudioBufferSourceNode], [], P> {
    static description = "WebAudio AudioBufferSourceNode";
    static inlets: IInletsMeta = [{
        isHot: true,
        type: "anything",
        description: "Bang to output AudioBufferSourceNode instance, boolean/number to start/stop, AudioBuffer/PatcherAudio to set buffer"
    }, {
        isHot: false,
        type: "signal",
        description: "playbackRate: bpf or node connection"
    }, {
        isHot: false,
        type: "signal",
        description: "detune: bpf or node connection"
    }, {
        isHot: false,
        type: "boolean",
        description: "loop"
    }, {
        isHot: false,
        type: "number",
        description: "loopStart (seconds)"
    }, {
        isHot: false,
        type: "number",
        description: "loopEnd (seconds)"
    }];
    static outlets: IOutletsMeta = [{
        type: "signal",
        description: "Node connection"
    }, {
        type: "object",
        description: "Instance: AudioBufferSourceNode"
    }];
    static props: IPropsMeta<P> = {
        detune: {
            type: "number",
            default: 0,
            description: "Initial detune, detuning of playback in cents"
        },
        playbackRate: {
            type: "number",
            default: 1,
            description: "Initial playbackRate, The speed at which to render the audio stream"
        },
        loop: {
            type: "boolean",
            default: false,
            description: "Initial loop, Indicates if the region of audio data designated by loopStart and loopEnd should be played continuously in a loop"
        },
        loopStart: {
            type: "number",
            default: 0,
            description: "An optional playhead position where looping should begin if the loop attribute is true. If <=0 or > duration, loop will end at the end of the buffer."
        },
        loopEnd: {
            type: "number",
            default: 0,
            description: "An optional playhead position where looping should end if the loop attribute is true. If <=0 or > duration, loop will end at the end of the buffer."
        }
    };
    _: S = { node: this.audioCtx.createBufferSource(), playing: false };
    inletAudioConnections = [{ node: this.node, index: 0 }, { node: this.node.playbackRate }, { node: this.node.detune }];
    outletAudioConnections = [{ node: this.node, index: 0 }];
    handleEnded = () => {
        this.outlet(1, new Bang());
        this.resetNode();
    };
    subscribe() {
        super.subscribe();
        this.on("preInit", () => {
            this.inlets = 6;
            this.outlets = 2;
            this.node.addEventListener("ended", this.handleEnded);
            handleProps(this.box.props);
        });
        const handleProps = (props: Partial<P>) => {
            const paramMap = ["playbackRate", "detune"] as const;
            const numberParamMap = ["loopStart", "loopEnd"] as const;
            const booleanParamMap = ["loop"] as const;
            try {
                paramMap.forEach((key) => {
                    if (typeof props[key] === "number") this.node[key].setValueAtTime(props[key], this.audioCtx.currentTime);
                });
                numberParamMap.forEach((key) => {
                    if (typeof props[key] === "number") this.node[key] = props[key];
                });
                booleanParamMap.forEach((key) => {
                    if (typeof props[key] === "boolean") this.node[key] = props[key];
                });
            } catch (e) {
                this.error(e.message);
            }
        }
        this.on("updateProps", handleProps);
        this.on("inlet", ({ data, inlet }) => {
            const paramMap = ["playbackRate", "detune"] as const;
            if (inlet === 0) {
                if (isBang(data)) {
                    this.outlet(2, this.node);
                } else if (typeof data === "boolean" || typeof data === "number") {
                    if (data) {
                        if (!this._.playing) {
                            this.node.start();
                            this._.playing = true;
                        }
                    } else {
                        if (this._.playing) {
                            this.node.stop();
                            this.resetNode();
                        }
                    }
                } else if (data instanceof AudioBuffer) {
                    if (data !== this.node.buffer) this.resetNode(data);
                } else if (data instanceof PatcherAudio) {
                    if (data.audioBuffer !== this.node.buffer) this.resetNode(data.audioBuffer);
                }
            } else if (inlet >= 1 && inlet <= 2) {
                try {
                    const bpf = decodeLine(data as TBPF);
                    this.applyBPF(this.node[paramMap[inlet - 1]], bpf);
                } catch (e) {
                    this.error(e.message);
                }
            } else if (inlet === 3) {
                if (typeof data === "boolean") {
                    try {
                        this.node.loop = data;
                    } catch (e) {
                        this.error(e.message);
                    }
                }
            } else if (inlet > 3) {
                if (typeof data === "number") {
                    try {
                        if (inlet === 4) this.node.loopStart = data;
                        else if (inlet === 5) this.node.loopEnd = data;
                    } catch (e) {
                        this.error(e.message);
                    }
                }
            }
        });
        this.on("destroy", () => {
            if (this._.playing) this.node.stop();
            this.node.removeEventListener("ended", this.handleEnded);
        });
    }
    resetNode(bufferIn?: AudioBuffer) {
        this.disconnectAudio();
        this._.playing = false;
        this.node.removeEventListener("ended", this.handleEnded);
        const { loop, loopStart, loopEnd } = this.node;
        const buffer = bufferIn || this.node.buffer;
        const playbackRate = this.node.playbackRate.value;
        const detune = this.node.detune.value;
        this.node = this.audioCtx.createBufferSource();
        this.node.buffer = buffer;
        this.node.loop = loop;
        this.node.loopStart = loopStart;
        this.node.loopEnd = loopEnd;
        this.node.playbackRate.setValueAtTime(playbackRate, this.audioCtx.currentTime);
        this.node.detune.setValueAtTime(detune, this.audioCtx.currentTime);
        this.node.addEventListener("ended", this.handleEnded);
        this.inletAudioConnections[0] = { node: this.node, index: 0 };
        this.inletAudioConnections[1] = { node: this.node.playbackRate };
        this.inletAudioConnections[2] = { node: this.node.detune };
        this.outletAudioConnections[0] = { node: this.node, index: 0 };
        this.connectAudio();
    }
}
