import { supabase } from '../../supabaseClient';

class StorageService {
    public static async uploadFile(file: File, folder: string): Promise<{ publicURL: string }> {
        if (!file) {
            throw new Error('No file provided for upload.');
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        const { error } = await supabase.storage
            .from('inventory-images') // Make sure this bucket exists in your Supabase project
            .upload(filePath, file);

        if (error) {
            console.error('Error uploading file to Supabase Storage:', error);
            throw new Error(error.message);
        }

        const { data } = supabase.storage
            .from('inventory-images')
            .getPublicUrl(filePath);

        if (!data || !data.publicUrl) {
            throw new Error('Could not get public URL for uploaded file.');
        }

        return { publicURL: data.publicUrl };
    }
}

export default StorageService;