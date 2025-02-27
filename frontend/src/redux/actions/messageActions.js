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
    
    if (response.status !== 200) {
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

export const fetchAllTags = createAsyncThunk ('messages/fetchAllTags', async() => {
  try {
    const api = `${API_BASE_URL}${API_ROUTES.TAGS}`;
    
    console.log('Calling', api)
    const response = await axios({
      method: 'GET',
      url: api,
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (response.status !== 200) {
      throw new Error(`Failed to fetch all tags: ${response.status}`);
    }
    
    const result = await response?.data;
    let data = await result?.data ?? [];
    console.log("Successfully fetched all tags", data?.length)
    return data
  } catch (error) {
    console.error('Error fetching all tags:', error);
    return null;
  }
});

export const fetchThumbnail = createAsyncThunk ('messages/fetchThumbnail', async(thumbnail) => {
  try {
    console.log('Calling', thumbnail) 
    const response = await axios.get(thumbnail, { responseType: 'blob' });
    
    if (response.status !== 200 || response.data.type === 'text/html') {
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

export const fetchVideo = createAsyncThunk ('messages/fetchVideo', async(video) => {
  try {
    console.log('Calling', video) 
    const response = await axios.head(video);
    
    if (response.status !== 200) {
      throw new Error(`Failed to fetch video: ${response.status}`);
    }

    const data = {type: response.headers['content-type'] }
    console.log("Successfully fetched video", data)
    return data
  } catch (error) {
    console.error('Error fetching video type', error);
    return null;
  }
});

export const addMessage = createAsyncThunk('messages/addMessage', async (message, { rejectWithValue }) => {
  try {
    const { title, description, thumbnail, video, tags, gen_transcript } = message;

    const api = `${API_BASE_URL}${API_ROUTES.MESSAGES}`;

    let payload = {
      title: title,
      description: description,
      thumbnail: thumbnail,
      video: video,
      tags: tags
    }
    if(gen_transcript){
      payload = {...payload, gen_transcript: gen_transcript}
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

    if (response.status !== 201) {
      throw new Error(`Failed to add message: Status code: ${response.status}`);
    }

    console.log('Successfully added message', title)
    return true
  } catch (error) {
    console.error('Error adding message:', error);
    const errorMessage = (
      error.response?.data?.message
      || error.response?.data?.msg
      || error.message
      || 'An unknown error occurred'
    );
    return rejectWithValue(errorMessage);
  }
});

export const editMessage = createAsyncThunk('messages/editMessage', async (message, { rejectWithValue }) => {
  try {
    const { id, title, description, thumbnail, video, tags, gen_transcript } = message;

    const api = `${API_BASE_URL}${API_ROUTES.MESSAGES}?id=${id}`;
    
    let payload = {
      title: title,
      description: description,
      thumbnail: thumbnail,
      video: video,
      tags: tags
    }
    if(gen_transcript){
      payload = {...payload, gen_transcript: gen_transcript}
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

    if (response.status !== 200) {
      throw new Error(`Failed to edit message: Status code: ${response.status}`);
    }

    console.log('Successfully edited message', title)
    return true
  } catch (error) {
    const errorMessage = (
      error.response?.data?.message
      || error.response?.data?.msg
      || error.message
      || 'An unknown error occurred'
    );
    return rejectWithValue(errorMessage);
  }
});

export const addTags = createAsyncThunk('messages/addTags', async (tags, { rejectWithValue }) => {
  try {
    const api = `${API_BASE_URL}${API_ROUTES.TAGS}`;

    let payload = {
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

    if (response.status !== 201) {
      throw new Error(`Failed to add tags: Status code: ${response.status}`);
    }

    console.log('Successfully added tags')
    return true
  } catch (error) {
    console.error('Error adding tags:', error);
    const errorMessage = (
      error.response?.data?.message
      || error.response?.data?.msg
      || error.message
      || 'An unknown error occurred'
    );
    return rejectWithValue(errorMessage);
  }
});

export const assignTags = createAsyncThunk('messages/assignTags', async ({messageIds, tagIds}, { rejectWithValue }) => {
  try {
    const api = `${API_BASE_URL}${API_ROUTES.MESSAGE_TAGS}`;
    
    let payload = {
      message_ids: messageIds,
      tag_ids: tagIds
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

    if (response.status !== 201) {
      throw new Error(`Failed to assign message tags: Status code: ${response.status}`);
    }

    console.log('Successfully assigned message tags')
    return true
  } catch (error) {
    const errorMessage = (
      error.response?.data?.message
      || error.response?.data?.msg
      || error.message
      || 'An unknown error occurred'
    );
    return rejectWithValue(errorMessage);
  }
});
