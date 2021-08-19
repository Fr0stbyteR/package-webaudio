import WebAudioObject from "./base";
import { Bang, isBang, PatcherAudio } from "../sdk";
import type { IInletsMeta, IOutletsMeta, IPropsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";

type I = [Bang, AudioBuffer | PatcherAudio, boolean];
type O = [null, ConvolverNode];
interface P {
    normalize: boolean;
}

export default class Convolver extends WebAudioObject<ConvolverNode, {}, I, O, [], P> {
    static description = "WebAudio ConvolverNode";
    static inlets: IInletsMeta = [{
        isHot: true,
        type: "signal",
        description: "Node connection, bang to output ConvolverNode instance"
    }, {
        isHot: true,
        type: "object",
        description: "buffer (2-4 channels): AudioBuffer"
    }, {
        isHot: true,
        type: "boolean",
        description: "normalize: boolean"
    }];
    static outlets: IOutletsMeta = [{
        type: "signal",
        description: "Node connection (2-4 channels)"
    }, {
        type: "object",
        description: "Instance: ConvolverNode"
    }];
    static props: IPropsMeta<P> = {
        normalize: {
            type: "boolean",
            default: true,
            description: "Controls whether the impulse response from the buffer will be scaled by an equal-power normalization"
        }
    };
    _ = { node: this.audioCtx.createConvolver() };
    inletAudioConnections = [{ node: this.node, index: 0 }];
    outletAudioConnections = [{ node: this.node, index: 0 }];
    subscribe() {
        super.subscribe();
        this.on("preInit", () => {
            this.inlets = 3;
            this.outlets = 2;
            this.node.channelInterpretation = "discrete";
            handleProps(this.box.props);
        });
        const handleProps = (props: Partial<P>) => {
            try {
                if (typeof props.normalize === "boolean") this.node.normalize = props.normalize;
            } catch (e) {
                this.error((e as Error).message);
            }
        }
        this.on("updateProps", handleProps);
        this.on("inlet", ({ data, inlet }) => {
            if (inlet === 0) {
                if (isBang(data)) this.outlet(1, this.node);
            } else if (inlet === 1) {
                if (data instanceof AudioBuffer) {
                    try {
                        this.node.buffer = data;
                    } catch (e) {
                        this.error((e as Error).message);
                    }
                } else if (data instanceof PatcherAudio) {
                    try {
                        this.node.buffer = data.audioBuffer;
                    } catch (e) {
                        this.error((e as Error).message);
                    }
                } else {
                    this.error("Invalid ArrayBuffer");
                }
            } else if (inlet === 2) {
                if (typeof data === "boolean") {
                    try {
                        this.node.normalize = data;
                    } catch (e) {
                        this.error((e as Error).message);
                    }
                }
            }
        });
    }
}
