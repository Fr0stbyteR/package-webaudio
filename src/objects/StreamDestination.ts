import WebAudioObject from "./base";
import { Bang, isBang } from "../sdk";
import type { IInletsMeta, IOutletsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";

export default class StreamDest extends WebAudioObject<MediaStreamAudioDestinationNode, {}, [Bang], [MediaStreamAudioDestinationNode, MediaStream]> {
    static description = "WebAudio MediaStreamAudioDestinationNode";
    static inlets: IInletsMeta = [{
        isHot: true,
        type: "signal",
        description: "Node connection, bang to output MediaStreamAudioDestinationNode instance with its stream"
    }];
    static outlets: IOutletsMeta = [{
        type: "object",
        description: "Instance: MediaStreamAudioDestinationNode"
    }, {
        type: "object",
        description: "Stream"
    }];
    _ = { node: this.audioCtx.createMediaStreamDestination() };
    inletAudioConnections = [{ node: this.node, index: 0 }];
    subscribe() {
        super.subscribe();
        this.on("preInit", () => {
            this.inlets = 1;
            this.outlets = 2;
            this.node.channelInterpretation = "discrete";
        });
        this.on("inlet", ({ data, inlet }) => {
            if (inlet === 0) {
                if (isBang(data)) this.outletAll([this.node, this.node.stream]);
            }
        });
    }
}
