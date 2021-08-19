import WebAudioObject from "./base";
import { Bang, isBang } from "../sdk";
import type { IInletsMeta, IOutletsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";

export default class Destination extends WebAudioObject<AudioDestinationNode, {}, [Bang], [AudioDestinationNode]> {
    static description = "WebAudio DestinationNode";
    static inlets: IInletsMeta = [{
        isHot: true,
        type: "signal",
        description: "Node connection, bang to output DestinationNode instance"
    }];
    static outlets: IOutletsMeta = [{
        type: "object",
        description: "Instance: DestinationNode"
    }];
    _ = { node: this.audioCtx.destination };
    inletAudioConnections = [{ node: this.node, index: 0 }];
    subscribe() {
        super.subscribe();
        this.on("preInit", () => {
            this.inlets = 1;
            this.outlets = 1;
            this.node.channelInterpretation = "discrete";
        });
        this.on("inlet", ({ data, inlet }) => {
            if (inlet === 0) {
                if (isBang(data)) this.outlet(0, this.node);
            }
        });
    }
}
