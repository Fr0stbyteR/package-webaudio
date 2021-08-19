import WebAudioObject from "./base";
import { Bang, isBang } from "../sdk";
import { decodeLine, TBPF } from "../utils";
import type { IInletsMeta, IOutletsMeta, IArgsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";

export default class StereoPanner extends WebAudioObject<StereoPannerNode, {}, [Bang, TBPF], [null, StereoPannerNode], [number]> {
    static description = "WebAudio StereoPannerNode";
    static inlets: IInletsMeta = [{
        isHot: true,
        type: "signal",
        description: "Node connection, bang to output StereoPannerNode instance"
    }, {
        isHot: false,
        type: "signal",
        description: "pan: bpf or node connection"
    }];
    static outlets: IOutletsMeta = [{
        type: "signal",
        description: "Node connection"
    }, {
        type: "object",
        description: "Instance: StereoPannerNode"
    }];
    static args: IArgsMeta = [{
        type: "number",
        optional: true,
        description: "Initial pan",
        default: 0
    }];
    _ = { node: this.audioCtx.createStereoPanner() };
    inletAudioConnections = [{ node: this.node, index: 0 }, { node: this.node.pan }];
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
                    this.node.pan.setValueAtTime(args[0], this.audioCtx.currentTime);
                } catch (e) {
                    this.error((e as Error).message);
                }
            }
        };
        this.on("updateArgs", handleArgs);
        this.on("inlet", ({ data, inlet }) => {
            if (inlet === 0) {
                if (isBang(data)) this.outlet(1, this.node);
            } else if (inlet === 1) {
                try {
                    const bpf = decodeLine(data as TBPF);
                    this.applyBPF(this.node.pan, bpf);
                } catch (e) {
                    this.error(e.message);
                }
            }
        });
    }
}
