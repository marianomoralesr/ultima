import { supabase } from '../../supabaseClient';
import r2Storage from './R2StorageService';

class StorageService {
    /**
     * Upload a file to cloud storage
     * Tries R2 first (if configured), falls back to Supabase
     *
     * @param file - File to upload
     * @param folder - Folder/prefix for the file
     * @returns Object with publicURL of the uploaded file
     */
    public static async uploadFile(file: File, folder: string): Promise<{ publicURL: string }> {
        if (!file) {
            throw new Error('No file provided for upload.');
        }

        // Try R2 first if it's configured
        if (r2Storage.isAvailable()) {
            try {
                console.log('Uploading to R2 storage...');
                const path = r2Storage.generatePath(folder, file.name);
                const publicURL = await r2Storage.uploadFile(file, path);
                console.log('R2 upload successful:', publicURL);
                return { publicURL };
            } catch (error) {
                console.error('R2 upload failed, falling back to Supabase:', error);
                // Fall through to Supabase upload
            }
        } else {
            console.log('R2 not configured, using Supabase storage');
        }

        // Fallback to Supabase storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        const { error } = await supabase.storage
            .from('inventory-images')
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

        console.log('Supabase upload successful:', data.publicUrl);
        return { publicURL: data.publicUrl };
    }
}

export default StorageService;