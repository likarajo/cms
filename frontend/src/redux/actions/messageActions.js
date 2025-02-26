import { createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE_URL, API_ROUTES } from "@/constants";
import axios from 'axios';

export const fetchMessages = createAsyncThunk ('messages/fetchMessages', async() => {
  try {
    const api = `${API_BASE_URL}${API_ROUTES.MESSAGES}`;
    
    console.log('Calling', api)
    const response = await axios({
      method: 'GET',
      url: api,
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.status === 200) {
      throw new Error(`Failed to fetch messages: ${response.status}`);
    }
    
    const result = await response?.data;
    let data = await result?.data ?? [];
    console.log("Successfully fetched messages", data?.length)
    return data
  } catch (error) {
    console.error('Error fetching messages:', error);
    return null;
  }
});

export const fetchThumbnail = createAsyncThunk ('messages/fetchThumbnail', async(thumbnail) => {
  try {
    console.log('Calling', thumbnail) 
    const response = await axios.get(thumbnail, { responseType: 'blob' });
    
    if (!response.status === 200 || response.data.type === 'text/html') {
      throw new Error(`Failed to fetch thumbnail: ${response.status} ${response.data.type}`);
    }
    
    const blob = await response.data;
    const data = {size: blob.size, type: blob.type }
    console.log("Successfully fetched thumbnail", data)
    return data
  } catch (error) {
    console.error('Error fetching thumbnail:', error);
    return null;
  }
});

export const addMessage = createAsyncThunk('messages/addMessage', async (message) => {
  try {
    const { title, description, thumbnail, tags } = message;

    const api = `${API_BASE_URL}${API_ROUTES.MESSAGES}`;

    const payload = {
      title: title,
      description: description,
      thumbnail: thumbnail,
      tags: tags
    }
  
    console.log('Calling', api, payload)
    const response = await axios({
      method: 'POST',
      url: api,
      data: payload,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.status === 201) {
      throw new Error(`Failed to add message: ${response.status}`);
    }

    console.log('Successfully added message')
    return true
  } catch (error) {
    console.error('Error adding message:', error);
    return false
  }
});

export const editMessage = createAsyncThunk('messages/editMessage', async (message) => {
  try {
    const { id, title, description, thumbnail, tags } = message;

    const api = `${API_BASE_URL}${API_ROUTES.MESSAGES}?id=${id}`;
    
    const payload = {
      title: title,
      description: description,
      thumbnail: thumbnail,
      tags: tags
    }
  
    console.log('Calling', api, payload)
    const response = await axios({
      method: 'PUT',
      url: api,
      data: payload,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.status === 200) {
      throw new Error(`Failed to edit message: ${response.status}`);
    }

    console.log('Successfully edited message', title)
    return true
  } catch (error) {
    console.error('Error editing message:', error);
    return false
  }
});
