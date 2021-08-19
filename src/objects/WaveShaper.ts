import WebAudioObject from "./base";
import { Bang, isBang } from "../sdk";
import type { IInletsMeta, IOutletsMeta, IPropsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";

type I = [Bang, Float32Array, OverSampleType];
interface P {
    oversample: OverSampleType;
}

export default class WaveShaper extends WebAudioObject<WaveShaperNode, {}, I, [null, WaveShaperNode], [], P> {
    static description = "WebAudio WaveShaperNode";
    static inlets: IInletsMeta = [{
        isHot: true,
        type: "signal",
        description: "Node connection, bang to output WaveShaperNode instance"
    }, {
        isHot: false,
        type: "object",
        description: "curve: Float32Array"
    }, {
        isHot: false,
        type: "enum",
        enums: ["none", "2x", "4x"],
        description: 'oversample: "none" | "2x" | "4x"'
    }];
    static outlets: IOutletsMeta = [{
        type: "signal",
        description: "Node connection"
    }, {
        type: "object",
        description: "Instance: WaveShaperNode"
    }];
    static props: IPropsMeta<P> = {
        oversample: {
            type: "enum",
            enums: ["none", "2x", "4x"],
            default: "none",
            description: "Initial oversample"
        }
    };
    _ = { node: this.audioCtx.createWaveShaper() };
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
                if (typeof props.oversample === "string") this.node.oversample = props.oversample;
            } catch (e) {
                this.error(e.message);
            }
        }
        this.on("updateProps", handleProps);
        this.on("inlet", ({ data, inlet }) => {
            if (inlet === 0) {
                if (isBang(data)) this.outlet(1, this.node);
            } else if (inlet === 1) {
                try {
                    if (data instanceof Float32Array) this.node.curve = data;
                    else this.error("The curve is not a Float32Array.");
                } catch (e) {
                    this.error(e.message);
                }
            } else if (inlet === 2) {
                try {
                    if (typeof data === "string") this.node.oversample = data as OverSampleType;
                    else this.error("Incorrect oversample type.");
                } catch (e) {
                    this.error(e.message);
                }
            }
        });
    }
}
