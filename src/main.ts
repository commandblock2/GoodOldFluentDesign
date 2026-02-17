import "./app.scss";
import "fluent-reveal-svelte/styles/reveal.css";
import App from "./App.svelte";
import {mount} from "svelte";

const app = mount(App, {
    target: document.getElementById("app")}
);
export default app
