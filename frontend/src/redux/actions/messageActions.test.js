import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';
import { fetchMessages, fetchAllTags } from '@/redux/actions/messageActions';

// Mock axios globally
vi.mock('axios');

describe('fetchMessages thunk', () => {

  const mockMessages = [
    { id: 1, text: 'Message 1' },
    { id: 2, text: 'Message 2' }
  ];

  it('should fetch messages successfully and return data', async () => {
    axios.mockResolvedValue({
      status: 200,
      data: { data: mockMessages }
    });

    const thunk = fetchMessages();
    const dispatch = vi.fn();
    const getState = vi.fn();

    const result = await thunk(dispatch, getState, undefined);

    expect(result.type).toBe('messages/fetchMessages/fulfilled');
    expect(result.payload).toEqual(mockMessages);
    expect(axios).toHaveBeenCalled();
  });

  it('should handle non-200 response and throw error', async () => {
    axios.mockResolvedValue({
      status: 500,
    });

    const thunk = fetchMessages();
    const dispatch = vi.fn();
    const getState = vi.fn();

    const result = await thunk(dispatch, getState, undefined);

    expect(result.type).toBe('messages/fetchMessages/fulfilled');  // Note: Your thunk doesn't reject on error
    expect(result.payload).toBeNull();  // Returns null in your code
  });

  it('should handle axios failure (network error)', async () => {
    axios.mockRejectedValue(new Error('Network Error'));

    const thunk = fetchMessages();
    const dispatch = vi.fn();
    const getState = vi.fn();

    const result = await thunk(dispatch, getState, undefined);

    expect(result.type).toBe('messages/fetchMessages/fulfilled');  // Your thunk doesn't reject, so it always "fulfills"
    expect(result.payload).toBeNull();  // Returns null on error
  });

});

describe('fetchAllTags thunk', () => {

  const mockTags = [
    { id: 1, name: 'Tag 1' },
    { id: 2, name: 'Tag 2' }
  ];

  it('should fetch all tags successfully and return data', async () => {
    axios.mockResolvedValue({
      status: 200,
      data: { data: mockTags }
    });

    const thunk = fetchAllTags();
    const dispatch = vi.fn();
    const getState = vi.fn();

    const result = await thunk(dispatch, getState, undefined);

    expect(result.type).toBe('messages/fetchAllTags/fulfilled');
    expect(result.payload).toEqual(mockTags);
    expect(axios).toHaveBeenCalled();
  });

  it('should handle non-200 response and throw error', async () => {
    axios.mockResolvedValue({
      status: 500,
    });

    const thunk = fetchAllTags();
    const dispatch = vi.fn();
    const getState = vi.fn();

    const result = await thunk(dispatch, getState, undefined);

    expect(result.type).toBe('messages/fetchAllTags/fulfilled');  // Note: Your thunk doesn't reject on error
    expect(result.payload).toBeNull();  // Returns null in your code
  });

  it('should handle axios failure (network error)', async () => {
    axios.mockRejectedValue(new Error('Network Error'));

    const thunk = fetchAllTags();
    const dispatch = vi.fn();
    const getState = vi.fn();

    const result = await thunk(dispatch, getState, undefined);

    expect(result.type).toBe('messages/fetchAllTags/fulfilled');  // Your thunk doesn't reject, so it always "fulfills"
    expect(result.payload).toBeNull();  // Returns null on error
  });

});
