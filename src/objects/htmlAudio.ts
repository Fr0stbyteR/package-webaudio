import { Bang, BaseObject, DOMUI, isBang } from "../sdk";
import type { IArgsMeta, IInletsMeta, IOutletsMeta, IPropsMeta } from "@jspatcher/jspatcher/src/core/objects/base/AbstractObject";
import type { DOMUIState } from "@jspatcher/jspatcher/src/core/objects/base/DOMUI";

interface HTMLAudioElement extends globalThis.HTMLAudioElement {
    preservesPitch: boolean;
    crossOrigin: "anonymous" | "" | "use-credentials";
}

interface P extends Pick<HTMLAudioElement, "autoplay" | "controls" | "loop" | "muted" | "preload" | "playbackRate" | "volume" | "preservesPitch" | "crossOrigin"> {
}

export default class htmlAudio extends BaseObject<{}, {}, [Bang | string | boolean | number], [HTMLAudioElement], [string], P, DOMUIState> {
    static description = "HTMLAudioElement constructor";
    static inlets: IInletsMeta = [{
        isHot: true,
        type: "anything",
        description: "String to change the source URL and output, number to set time, boolean to pause/start, bang to output"
    }];
    static outlets: IOutletsMeta = [{
        type: "object",
        description: "HTMLAudioElement"
    }];
    static args: IArgsMeta = [{
        type: "string",
        description: "Specifies the URL of the audio file",
        optional: true
    }];
    static props: IPropsMeta<P> = {
        autoplay: {
            type: "boolean",
            description: "Specifies that the audio will start playing as soon as it is ready",
            default: false
        },
        controls: {
            type: "boolean",
            description: "Specifies that audio controls should be displayed (such as a play/pause button etc)",
            default: true
        },
        loop: {
            type: "boolean",
            description: "Specifies that the audio will start over again, every time it is finished",
            default: false
        },
        muted: {
            type: "boolean",
            description: "Specifies that the audio output should be muted",
            default: false
        },
        preload: {
            type: "enum",
            enums: ["auto", "metadata", "none", ""],
            description: "Specifies if and how the author thinks the audio should be loaded when the page loads",
            default: "auto"
        },
        preservesPitch: {
            type: "boolean",
            description: "Switches the pitch-preserving algorithm on or off",
            default: false
        },
        volume: {
            type: "number",
            description: "Sets the volume level",
            default: 1
        },
        playbackRate: {
            type: "number",
            description: "Sets the current rate of speed for the media resource to play",
            default: 1
        },
        crossOrigin: {
            type: "enum",
            enums: ["anonymous", "use-credentials", ""],
            description: "CORS settings",
            default: ""
        }
    };
    static UI = class extends DOMUI<htmlAudio> {
        state: DOMUIState = { ...this.state, children: [this.object._.element] };
    }; 

    _ = { element: document.createElement("audio") as HTMLAudioElement };
    subscribe() {
        super.subscribe();
        const handleAudioCtxStateChange = () => {
            const e = this._.element;
            if (e.autoplay && e.paused) e.play();
        };
        this.on("preInit", () => {
            this.inlets = 1;
            this.outlets = 1;
        });
        this.on("postInit", () => {
            const e = this._.element;
            e.style.position = "absolute";
            e.style.width = "100%";
            e.style.height = "100%";
            const { autoplay, controls, loop, muted, preload, preservesPitch, volume, playbackRate, crossOrigin } = this.props;
            e.autoplay = autoplay;
            e.controls = controls;
            e.loop = loop;
            e.muted = muted;
            e.preload, preload,
            e.preservesPitch = preservesPitch;
            e.volume = volume;
            e.playbackRate = playbackRate;
            e.crossOrigin = crossOrigin;
            e.src = this.args[0] || "";
            this.updateUI({ children: [e] });
            this.audioCtx.addEventListener("statechange", handleAudioCtxStateChange);
        });
        this.on("updateArgs", () => {
            this._.element.src = this.args[0] || "";
        });
        this.on("updateProps", (props) => {
            for (const key in props) {
                if (key in this._.element) {
                    const k = key as keyof P;
                    const v = props[k] as any;
                    //@ts-ignore
                    if (typeof v !== "undefined" && v !== null) this._.element[k] = v;
                }
            }
        })
        this.on("inlet", ({ data, inlet }) => {
            if (inlet === 0) {
                if (!isBang(data)) {
                    if (typeof data === "string") {
                        this._.element.src = data;
                    } else if (typeof data === "boolean") {
                        if (!!data && this._.element.paused) this._.element.play();
                        else if (!data && !this._.element.paused) this._.element.pause();
                    } else if (typeof data === "number") {
                        this._.element.currentTime = +data;
                    }
                }
                this.outlet(0, this._.element);
            }
        });
        this.on("destroy", () => {
            this.audioCtx.removeEventListener("statechange", handleAudioCtxStateChange);
        })
    }
}
