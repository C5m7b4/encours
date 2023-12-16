import { encours } from "encours";

const root = document.getElementById("app");
const initialState = {};
const reducers = {};

function AddTodo(state, emit) {
  return (
    <div>
      <p>add todo</p>
    </div>
  );
}

function App(state, emit) {
  return (
    <div>
      <h2>My Todos</h2>
      <AddTodo />
    </div>
  );
}

encours.createApp({ state: initialState, reducers, view: App }).mount(root);
