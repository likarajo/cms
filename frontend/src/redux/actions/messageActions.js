import { createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE_URL, API_ROUTES, MAX_IMAGE_SIZE_MB, ALLOWED_IMAGE_FORMATS } from "@/constants";

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

export const addMessage = createAsyncThunk('messages/addMessage', async ({ title, description, thumbnail }) => {
  try {
    
    if(thumbnail){
      // Client-side validation for thumbnail image
      if (thumbnail.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        alert(`Image size must be less than ${MAX_IMAGE_SIZE_MB} MB.`);
        return;
      }
      if (!ALLOWED_IMAGE_FORMATS.includes(thumbnail.type)) {
        alert("Only PNG and JPEG images are allowed.");
        return;
      }
    }

    const api = `${API_BASE_URL}/${API_ROUTES.MESSAGES}`;
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    
    if(thumbnail){
      formData.append('thumbnail', thumbnail);
    }
  
    console.log('Calling', api, formData)
    const response = await fetch(api, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to add message: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error adding message:', error);
    return null;
  }
});
