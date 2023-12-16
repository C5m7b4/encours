// import { encours } from "./encours";
import { encours } from "encours";

const root = document.getElementById("app");
const initialState = {};
const reducers = {};

function App(state, emit) {
  return (
    <div>
      <h2>This is my test app</h2>
    </div>
  );
}
encours.createApp({ state: initialState, reducers, view: App }).mount(root);
