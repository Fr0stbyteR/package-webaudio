import WebAudioObject from "./base";
import { Bang, isBang } from "../sdk";
import { decodeLine } from "@jspatcher/jspatcher/src/utils/utils";
import type { IInletsMeta, IOutletsMeta, IPropsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";
import type { TBPF } from "@jspatcher/jspatcher/src/core/types";

type I = [Bang, TBPF, TBPF, TBPF, TBPF, TBPF];
export default class Compressor extends WebAudioObject<DynamicsCompressorNode, {}, I, [null, DynamicsCompressorNode], [], DynamicsCompressorOptions> {
    static description = "WebAudio DynamicsCompressorNode";
    static inlets: IInletsMeta = [{
        isHot: true,
        type: "signal",
        description: "Node connection (1 channel), bang to output DynamicsCompressorNode instance"
    }, {
        isHot: false,
        type: "signal",
        description: "threshold: bpf or node connection"
    }, {
        isHot: false,
        type: "signal",
        description: "knee: bpf or node connection"
    }, {
        isHot: false,
        type: "signal",
        description: "ratio: bpf or node connection"
    }, {
        isHot: false,
        type: "signal",
        description: "attack: bpf or node connection"
    }, {
        isHot: false,
        type: "signal",
        description: "release: bpf or node connection"
    }];
    static outlets: IOutletsMeta = [{
        type: "signal",
        description: "Node connection (1 channel)"
    }, {
        type: "object",
        description: "Instance: DynamicsCompressorNode"
    }];
    static props: IPropsMeta<DynamicsCompressorOptions> = {
        threshold: {
            type: "number",
            default: -24,
            description: "Initial threshold"
        },
        knee: {
            type: "number",
            default: 30,
            description: "Initial knee"
        },
        ratio: {
            type: "number",
            default: 12,
            description: "Initial ratio"
        },
        attack: {
            type: "number",
            default: 0.003,
            description: "Initial attack"
        },
        release: {
            type: "number",
            default: 0.25,
            description: "Initial release"
        }
    };
    _ = { node: this.audioCtx.createDynamicsCompressor() };
    inletAudioConnections = [{ node: this.node, index: 0 }, { node: this.node.threshold }, { node: this.node.knee }, { node: this.node.ratio }, null, { node: this.node.attack }, { node: this.node.release }];
    outletAudioConnections = [{ node: this.node, index: 0 }];
    subscribe() {
        super.subscribe();
        this.on("preInit", () => {
            this.inlets = 6;
            this.outlets = 2;
            this.node.channelInterpretation = "discrete";
            handleProps(this.box.props);
        });
        const handleProps = (props: Partial<DynamicsCompressorOptions>) => {
            const paramMap = ["threshold", "knee", "ratio", "attack", "release"] as const;
            paramMap.forEach((key) => {
                try {
                    if (typeof props[key] === "number") this.node[key].setValueAtTime(props[key], this.audioCtx.currentTime);
                } catch (e) {
                    this.error(e.message);
                }
            });
        }
        this.on("updateProps", handleProps);
        this.on("inlet", ({ data, inlet }) => {
            const paramMap = ["threshold", "knee", "ratio", "attack", "release"] as const;
            if (inlet === 0) {
                if (isBang(data)) this.outlet(1, this.node);
            } else if (inlet > 0 && inlet < 6) {
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
