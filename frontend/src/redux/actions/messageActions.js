import { API_BASE_URL, API_ROUTES } from "@/constants";
import { setMessage } from "../reducers/messageReducer";

export const fetchMessage = () => async (dispatch) => {
  try {
    const api = `${API_BASE_URL}/${API_ROUTES.GET_MESSAGE}`;
    console.log('Calling', api)
    const response = await fetch(api);
    const data = await response.json();
    dispatch(setMessage(data.message));  // Dispatch action to update the state
  } catch (error) {
    dispatch(setMessage(error));
  }
};
