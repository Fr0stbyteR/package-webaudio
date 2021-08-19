import WebAudioObject from "./base";
import { Bang, isBang } from "../sdk";
import { decodeLine, TBPF } from "../utils";
import type { IInletsMeta, IOutletsMeta, IPropsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";

type I = [Bang, TBPF, TBPF, TBPF, TBPF, BiquadFilterType];
export default class Biquad extends WebAudioObject<BiquadFilterNode, {}, I, [null, BiquadFilterNode], [], BiquadFilterOptions> {
    static description = "WebAudio BiquadFilterNode";
    static inlets: IInletsMeta = [{
        isHot: true,
        type: "signal",
        description: "Node connection (1 channel), bang to output BiquadFilterNode instance"
    }, {
        isHot: false,
        type: "signal",
        description: "frequency: bpf or node connection"
    }, {
        isHot: false,
        type: "signal",
        description: "detune: bpf or node connection"
    }, {
        isHot: false,
        type: "signal",
        description: "Q: bpf or node connection"
    }, {
        isHot: false,
        type: "signal",
        description: "gain: bpf or node connection"
    }, {
        isHot: false,
        type: "enum",
        enums: ["lowpass", "highpass", "bandpass", "lowshelf", "highshelf", "peaking", "notch", "allpass"],
        description: 'type: "lowpass" | "highpass" | "bandpass" | "lowshelf" | "highshelf" | "peaking" | "notch" | "allpass"'
    }];
    static outlets: IOutletsMeta = [{
        type: "signal",
        description: "Node connection (1 channel)"
    }, {
        type: "object",
        description: "Instance: BiquadFilterNode"
    }];
    static props: IPropsMeta<BiquadFilterOptions> = {
        frequency: {
            type: "number",
            default: 350,
            description: "Initial frequency"
        },
        detune: {
            type: "number",
            default: 100,
            description: "Initial detune"
        },
        Q: {
            type: "number",
            default: 100,
            description: "Initial Q"
        },
        gain: {
            type: "number",
            default: 25,
            description: "Initial gain"
        },
        type: {
            type: "enum",
            enums: ["lowpass", "highpass", "bandpass", "lowshelf", "highshelf", "peaking", "notch", "allpass"],
            default: "lowpass",
            description: 'Initial type: "lowpass" | "highpass" | "bandpass" | "lowshelf" | "highshelf" | "peaking" | "notch" | "allpass"'
        }
    };
    static isBiquadFilterType = (x: any): x is BiquadFilterType => ["lowpass", "highpass", "bandpass", "lowshelf", "highshelf", "peaking", "notch", "allpass"].indexOf(x) >= 0;
    _ = { node: this.audioCtx.createBiquadFilter() };
    inletAudioConnections = [{ node: this.node, index: 0 }, { node: this.node.frequency }, { node: this.node.detune }, { node: this.node.Q }, { node: this.node.gain }];
    outletAudioConnections = [{ node: this.node, index: 0 }];
    subscribe() {
        super.subscribe();
        this.on("preInit", () => {
            this.inlets = 6;
            this.outlets = 2;
            this.node.channelInterpretation = "discrete";
            handleProps(this.box.props);
        });
        const handleProps =  (props: Partial<BiquadFilterOptions>) => {
            const paramMap = ["frequency", "detune", "Q", "gain"] as const;
            paramMap.forEach((key) => {
                try {
                    if (typeof props[key] === "number") this.node[key].setValueAtTime(props[key], this.audioCtx.currentTime);
                } catch (e) {
                    this.error(e.message);
                }
            });
            if (typeof props.type === "string") {
                try {
                    this.node.type = props.type;
                } catch (e) {
                    this.error(e.message);
                }
            }
        }
        this.on("updateProps", handleProps);
        this.on("inlet", ({ data, inlet }) => {
            const paramMap = ["frequency", "detune", "Q", "gain"] as const;
            if (inlet === 0) {
                if (isBang(data)) this.outlet(1, this.node);
            } else if (inlet === 5) {
                if (Biquad.isBiquadFilterType(data)) this.node.type = data;
            } else if (inlet > 0 && inlet < 5) {
                try {
                    const bpf = decodeLine(data as TBPF);
                    this.applyBPF(this.node[paramMap[inlet - 1]], bpf);
                } catch (e) {
                    this.error(e.message);
                }
            }
        });
    }
}
