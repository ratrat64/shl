import { reactive, computed } from "vue";
import { filterDirectory } from "./directory-model.mjs";

export const createDirectoryState = (model) => {
  const state = reactive({
    model,
    enhanced: false,
    text: "",
    selections: new Map(),
    picker: false,
    error: "",
    notice: "",
  });
  const results = computed(() =>
    filterDirectory(state.model.nodes, state.text, [
      ...state.selections.keys(),
    ]),
  );
  return { state, results };
};
