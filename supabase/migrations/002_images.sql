begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)values('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp'])on conflict(id)do update set public=true,file_size_limit=5242880,allowed_mime_types=excluded.allowed_mime_types;
create policy product_images_read on storage.objects for select using(bucket_id='product-images');
create policy product_images_upload on storage.objects for insert to authenticated with check(bucket_id='product-images'and(storage.foldername(name))[1]=auth.uid()::text and exists(select 1 from public.stores s where s.owner_id=auth.uid()));
create policy product_images_delete on storage.objects for delete to authenticated using(bucket_id='product-images'and(storage.foldername(name))[1]=auth.uid()::text and exists(select 1 from public.stores s where s.owner_id=auth.uid()));
commit;
