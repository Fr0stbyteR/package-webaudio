import { React, Bang, DefaultUI, isBang } from "../sdk";
import WebAudioObject from "./base";
import AudioIn, { Constraints } from "./AudioIn";
import type { IInletsMeta, IOutletsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";

const supportSetSinkId = window.MediaStreamAudioDestinationNode && HTMLMediaElement.prototype.setSinkId;
export default class AudioOut extends WebAudioObject<MediaStreamAudioDestinationNode | AudioDestinationNode, { search?: string; audio?: HTMLAudioElement; msadn?: MediaStreamAudioDestinationNode }, [string | Bang], [null, MediaStreamAudioDestinationNode | AudioDestinationNode], [string], Constraints> {
    static description = "Get Audio output from device name or ID (if supported)";
    static inlets: IInletsMeta = [{
        isHot: true,
        type: "signal",
        description: "Node connection, string to fetch device name or ID, bang to output Node"
    }];
    static outlets: IOutletsMeta = [{
        type: "object",
        description: `Instance: ${supportSetSinkId ? "MediaStreamAudioDestinationNode | " : ""}AudioDestinationNode`
    }];
    static args = supportSetSinkId ? AudioIn.args : [];
    static props = supportSetSinkId ? AudioIn.props : {};
    static UI = supportSetSinkId ? class AudioOutUI extends DefaultUI<AudioOut> {
        refContainer = React.createRef<HTMLDivElement>();
        componentDidMount() {
            super.componentDidMount();
            const div = this.refContainer.current;
            const { audio } = this.object._;
            if (div && audio) {
                audio.style.display = "none";
                div.appendChild(audio);
            }
        }
        render() {
            const textContainerProps = { ...this.props.textContainerProps, ref: this.refContainer };
            return (
                <DefaultUI textContainerProps={textContainerProps} {...this.props} />
            );
        }
    } : DefaultUI;
    _ = supportSetSinkId ? { node: this.audioCtx.destination, msadn: this.audioCtx.createMediaStreamDestination(), audio: new Audio(), search: undefined as string } : { node: this.audioCtx.destination };
    inletAudioConnections = [{ node: this.node, index: 0 }];
    handleDeviceChange = async () => {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const enums = devices.filter(d => d.kind === "audiooutput").map(d => d.label || d.deviceId);
        const { meta } = this;
        meta.args[0] = { ...AudioOut.args[0], type: "enum", enums };
        this.setMeta(meta);
    };
    newSearch = async (search?: string) => {
        if (!supportSetSinkId) return;
        this._.search = search;
        if (!search || search === "default") {
            this.resetNode();
            return;
        }
        const { audio } = this._;
        let deviceId = audio.sinkId || "default";
        const devices = await navigator.mediaDevices.enumerateDevices();
        const device = devices.find(d => d.kind === "audiooutput" && (d.deviceId === search || d.label === search));
        if (device) deviceId = device.deviceId;
        if (audio.sinkId !== deviceId) {
            if (audio.played) audio.pause();
            audio.setSinkId(deviceId);
            audio.play();
        }
        this.resetNode(true);
    };
    subscribe() {
        super.subscribe();
        this.on("preInit", () => {
            this.inlets = 1;
            this.outlets = 1;
        });
        this.on("postInit", () => {
            this.node.channelInterpretation = "discrete";
            if (supportSetSinkId) {
                this._.msadn.channelInterpretation = "discrete";
                const { audio, msadn } = this._;
                const { stream } = msadn;
                if ("srcObject" in audio) audio.srcObject = stream;
                else (audio as HTMLAudioElement).src = URL.createObjectURL(stream);
                const search = this.box.args[0];
                navigator.mediaDevices.addEventListener("devicechange", this.handleDeviceChange);
                this.on("destroy", () => {
                    navigator.mediaDevices.removeEventListener("devicechange", this.handleDeviceChange);
                });
                this.handleDeviceChange();
                this.newSearch(search);
            }
        });
        this.on("updateArgs", (args: [string]) => {
            this.newSearch(args[0]);
        });
        this.on("updateProps", () => {
            this.newSearch(this._.search);
        });
        this.on("inlet", async ({ data, inlet }) => {
            if (inlet === 0) {
                if (!isBang(data)) {
                    await this.newSearch(data);
                }
                if (this.node) this.outlet(1, this.node);
            }
        });
    }
    getConstraints(deviceId?: string): Constraints {
        return {
            deviceId,
            autoGainControl: this.getProp("autoGainControl"),
            channelCount: this.getProp("channelCount"),
            echoCancellation: this.getProp("echoCancellation"),
            latency: this.getProp("latency"),
            noiseSuppression: this.getProp("noiseSuppression"),
            sampleRate: this.getProp("sampleRate"),
            sampleSize: this.getProp("sampleSize")
        };
    }
    resetNode(msadn?: boolean) {
        if (msadn) {
            if (this.node !== this._.msadn) {
                this.disconnectAudio();
                this.node = this._.msadn;
                this.inletAudioConnections[0] = { node: this.node, index: 0 };
                this.connectAudio();
            }
        } else {
            if (this.node !== this.audioCtx.destination) {
                this.disconnectAudio();
                this.node = this.audioCtx.destination;
                this.inletAudioConnections[0] = { node: this.node, index: 0 };
                this.connectAudio();
            }
        }
    }
}
