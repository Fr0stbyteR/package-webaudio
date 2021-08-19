import WebAudioObject from "./base";
import { Bang, isBang } from "../sdk";
import { decodeLine, TBPF } from "../utils";
import type { IInletsMeta, IOutletsMeta, IArgsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";

export default class Constant extends WebAudioObject<ConstantSourceNode, {}, [Bang, TBPF], [null, ConstantSourceNode], [number]> {
    static description = "WebAudio ConstantSourceNode";
    static inlets: IInletsMeta = [{
        isHot: true,
        type: "bang",
        description: "Output ConstantSourceNode instance"
    }, {
        isHot: false,
        type: "signal",
        description: "offset: bpf or node connection"
    }];
    static outlets: IOutletsMeta = [{
        type: "signal",
        description: "Node connection (1 channel)"
    }, {
        type: "object",
        description: "Instance: ConstantSourceNode"
    }];
    static args: IArgsMeta = [{
        type: "number",
        optional: true,
        description: "Initial offset",
        default: 1
    }];
    _ = { node: this.audioCtx.createConstantSource() };
    inletAudioConnections = [null, { node: this.node.offset }];
    outletAudioConnections = [{ node: this.node, index: 0 }];
    subscribe() {
        super.subscribe();
        this.on("preInit", () => {
            this.inlets = 2;
            this.outlets = 2;
            this.node.channelInterpretation = "discrete";
            handleArgs(this.args);
            this.node.start();
        });
        const handleArgs = (args: [number?]) => {
            if (typeof args[0] === "number") {
                try {
                    this.node.offset.setValueAtTime(args[0], this.audioCtx.currentTime);
                } catch (e) {
                    this.error((e as Error).message);
                }
            }
        }
        this.on("updateArgs", handleArgs);
        this.on("inlet", ({ data, inlet }) => {
            if (inlet === 0) {
                if (isBang(data)) this.outlet(1, this.node);
            } else if (inlet === 1) {
                try {
                    const bpf = decodeLine(data as TBPF);
                    this.applyBPF(this.node.offset, bpf);
                } catch (e) {
                    this.error(e.message);
                }
            }
        });
    }
}
