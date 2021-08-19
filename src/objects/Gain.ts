import WebAudioObject from "./base";
import { Bang, isBang } from "../sdk";
import { decodeLine } from "@jspatcher/jspatcher/src/utils/utils";
import type { IInletsMeta, IOutletsMeta, IArgsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";
import type { TBPF } from "@jspatcher/jspatcher/src/core/types";

export default class Gain extends WebAudioObject<GainNode, {}, [Bang, TBPF], [null, GainNode], [number]> {
    static description = "WebAudio GainNode";
    static inlets: IInletsMeta = [{
        isHot: true,
        type: "signal",
        description: "Node connection, bang to output GainNode instance"
    }, {
        isHot: false,
        type: "signal",
        description: "gain: bpf or node connection"
    }];
    static outlets: IOutletsMeta = [{
        type: "signal",
        description: "Node connection"
    }, {
        type: "object",
        description: "Instance: GainNode"
    }];
    static args: IArgsMeta = [{
        type: "number",
        optional: true,
        description: "Initial gain",
        default: 1
    }];
    _ = { node: this.audioCtx.createGain() };
    inletAudioConnections = [{ node: this.node, index: 0 }, { node: this.node.gain }];
    outletAudioConnections = [{ node: this.node, index: 0 }];
    subscribe() {
        super.subscribe();
        this.on("preInit", () => {
            this.inlets = 2;
            this.outlets = 2;
            this.node.channelInterpretation = "discrete";
            handleArgs(this.args);
        });
        const handleArgs = (args: [number?]) => {
            if (typeof args[0] === "number") {
                try {
                    this.node.gain.setValueAtTime(args[0], this.audioCtx.currentTime);
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
                    this.applyBPF(this.node.gain, bpf);
                } catch (e) {
                    this.error(e.message);
                }
            }
        });
    }
}
