import { createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE_URL, API_ROUTES } from "@/constants";

export const fetchMessages = createAsyncThunk ('messages/fetchMessages', async() => {
  try {
    const api = `${API_BASE_URL}/${API_ROUTES.MESSAGES}`;
    console.log('Calling', api)
    const response = await fetch(api, {
      method: 'GET',
      headers: {'Content-Type': 'application/json'},
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.status}`);
    }
    const result = await response.json();
    let data = await result?.data ?? [];
    console.log("Successfully fetched messages", data?.length)
    return data
  } catch (error) {
    console.error('Error fetching messages:', error);
    return null;
  }
});
