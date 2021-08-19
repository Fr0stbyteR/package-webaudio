import WebAudioObject from "./base";
import { Bang, isBang } from "../sdk";
import { decodeLine } from "@jspatcher/jspatcher/src/utils/utils";
import type { IInletsMeta, IOutletsMeta, IArgsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";
import type { TBPF } from "@jspatcher/jspatcher/src/core/types";

export default class Delay extends WebAudioObject<DelayNode, {}, [Bang, TBPF], [null, DelayNode], [number]> {
    static description = "WebAudio DelayNode";
    static inlets: IInletsMeta = [{
        isHot: true,
        type: "signal",
        description: "Node connection, bang to output DelayNode instance"
    }, {
        isHot: false,
        type: "signal",
        description: "delayTime: bpf or node connection"
    }];
    static outlets: IOutletsMeta = [{
        type: "signal",
        description: "Node connection"
    }, {
        type: "object",
        description: "Instance: DelayNode"
    }];
    static args: IArgsMeta = [{
        type: "number",
        optional: true,
        description: "Initial delayTime"
    }];
    _ = { node: this.audioCtx.createDelay() };
    inletAudioConnections = [{ node: this.node, index: 0 }, { node: this.node.delayTime }];
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
                    this.node.delayTime.setValueAtTime(args[0], this.audioCtx.currentTime);
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
                    this.applyBPF(this.node.delayTime, bpf);
                } catch (e) {
                    this.error(e.message);
                }
            }
        });
    }
}
