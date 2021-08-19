import WebAudioObject from "./base";
import { Bang, isBang } from "../sdk";
import type { IInletsMeta, IOutletsMeta, IArgsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";

export default class Merger extends WebAudioObject<ChannelMergerNode, {}, [Bang | number, ...null[]], [null, ChannelMergerNode], [number]> {
    static description = "WebAudio ChannelMergerNode";
    static inlets: IInletsMeta = [{
        isHot: true,
        type: "signal",
        description: "Node connection, bang to output DestinationNode instance, number to change inputs"
    }, {
        isHot: false,
        type: "signal",
        description: "Node connection"
    }];
    static outlets: IOutletsMeta = [{
        type: "signal",
        description: "Node connection (n channels)"
    }, {
        type: "object",
        description: "Instance: ChannelMergerNode"
    }];
    static args: IArgsMeta = [{
        type: "number",
        optional: true,
        description: "Number of Inputs",
        default: 6
    }];
    _ = { node: null as ChannelMergerNode };
    outletAudioConnections = [{ node: this.node, index: 0 }];
    subscribe() {
        super.subscribe();
        this.on("preInit", () => {
            this.outlets = 2;
            handleArgs(this.args);
        });
        const handleArgs = (args: [number?]) => {
            const channelCount = (typeof args[0] === "number" && ~~args[0]) > 0 ? ~~args[0] : 6;
            this.resetNode(channelCount);
        }
        this.on("updateArgs", handleArgs);
        this.on("inlet", ({ data, inlet }) => {
            if (inlet === 0) {
                if (typeof data === "number") {
                    const channelCount = ~~data > 0 ? ~~data : 6;
                    if (this.node && channelCount !== this.node.numberOfInputs) this.resetNode(channelCount);
                    this.outlet(1, this.node);
                } else if (isBang(data)) this.outlet(1, this.node);
            }
        });
    }
    resetNode(channelCount: number) {
        this.disconnectAudio();
        this.node = this.audioCtx.createChannelMerger(channelCount);
        this.node.channelInterpretation = "discrete";
        const factoryMeta = Merger.meta as this["meta"];
        const bangInlet = factoryMeta.inlets[0];
        const siganlInlet = factoryMeta.inlets[1];
        this.inletAudioConnections = [{ node: this.node, index: 0 }];
        this.outletAudioConnections = [{ node: this.node, index: 0 }];
        factoryMeta.inlets = [bangInlet];
        for (let i = 1; i < channelCount; i++) {
            factoryMeta.inlets[i] = siganlInlet;
            this.inletAudioConnections[i] = { node: this.node, index: i };
        }
        this.setMeta(factoryMeta);
        this.inlets = channelCount;
        this.connectAudio();
    }
}
