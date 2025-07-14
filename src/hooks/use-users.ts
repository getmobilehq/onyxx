import { useState, useEffect } from 'react';
import { usersAPI } from '@/services/api';
import { toast } from 'sonner';

export function useUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await usersAPI.getAll();
      if (response.data.success) {
        setUsers(response.data.data.users);
      } else {
        throw new Error('Failed to fetch users');
      }
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setError(err.response?.data?.message || 'Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const getUser = async (id: string) => {
    try {
      const response = await usersAPI.getById(id);
      if (response.data.success && response.data.data.user) {
        return response.data.data.user;
      } else {
        throw new Error('User not found');
      }
    } catch (err: any) {
      toast.error('Failed to load user details');
      throw err;
    }
  };

  const inviteUser = async (data: { email: string; role: string; name: string }) => {
    try {
      const response = await usersAPI.invite(data);
      if (response.data.success) {
        await fetchUsers();
        toast.success('User invited successfully');
        return response.data.data.user;
      } else {
        throw new Error('Failed to invite user');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to invite user');
      throw err;
    }
  };

  const updateUser = async (id: string, data: any) => {
    try {
      const response = await usersAPI.update(id, data);
      if (response.data.success) {
        await fetchUsers();
        toast.success('User updated successfully');
        return response.data.data.user;
      } else {
        throw new Error('Failed to update user');
      }
    } catch (err: any) {
      toast.error('Failed to update user');
      throw err;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const response = await usersAPI.delete(id);
      if (response.data.success) {
        await fetchUsers();
        toast.success('User removed successfully');
      } else {
        throw new Error('Failed to delete user');
      }
    } catch (err: any) {
      toast.error('Failed to remove user');
      throw err;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    fetchUsers,
    getUser,
    inviteUser,
    updateUser,
    deleteUser,
  };
}