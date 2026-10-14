CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur JOIN auth.users u ON u.id = ur.user_id
    WHERE ur.user_id = _user_id AND ur.role = _role
      AND lower(u.email) = 'gustavopereiraaxcursos@gmail.com'
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_first_admin()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF lower(NEW.email) = 'gustavopereiraaxcursos@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE lower(email) = 'gustavopereiraaxcursos@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.users.id AND r.role = 'admin');

CREATE POLICY "anyone uploads exemplos" ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'exemplos');
CREATE POLICY "admin reads exemplos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'exemplos' AND public.has_role(auth.uid(), 'admin'));