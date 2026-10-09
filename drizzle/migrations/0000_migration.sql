CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- First user to sign up becomes admin
CREATE OR REPLACE FUNCTION public.handle_first_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created_admin AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_first_admin();

CREATE TABLE public.solicitacoes_orcamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_nome text NOT NULL,
  cliente_email text NOT NULL,
  cliente_telefone text,
  empresa text,
  fonte_dados text,
  volume_dados text,
  objetivo text,
  resolucao_painel text NOT NULL DEFAULT 'padrao' CHECK (resolucao_painel IN ('padrao','expandido','scroll')),
  tema text NOT NULL DEFAULT 'claro' CHECK (tema IN ('claro','escuro')),
  configuracao jsonb,
  status text NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente','Em Analise','Orcamento Enviado','Aprovado','Recusado')),
  observacoes_tecnicas text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.solicitacao_telas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id uuid NOT NULL REFERENCES public.solicitacoes_orcamento(id) ON DELETE CASCADE,
  nome_tela text NOT NULL,
  ordem int NOT NULL DEFAULT 0,
  posicao_cards text NOT NULL DEFAULT 'topo' CHECK (posicao_cards IN ('topo','lateral')),
  qtd_cards int NOT NULL DEFAULT 0 CHECK (qtd_cards BETWEEN 0 AND 5)
);
CREATE TABLE public.solicitacao_elementos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tela_id uuid NOT NULL REFERENCES public.solicitacao_telas(id) ON DELETE CASCADE,
  tipo_elemento text NOT NULL,
  posicao_index int NOT NULL DEFAULT 0,
  titulo text,
  descricao_informacoes text,
  detalhes_custom_html text
);

GRANT INSERT ON public.solicitacoes_orcamento, public.solicitacao_telas, public.solicitacao_elementos TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.solicitacoes_orcamento, public.solicitacao_telas, public.solicitacao_elementos TO authenticated;
GRANT ALL ON public.solicitacoes_orcamento, public.solicitacao_telas, public.solicitacao_elementos TO service_role;

ALTER TABLE public.solicitacoes_orcamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacao_telas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacao_elementos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone submits" ON public.solicitacoes_orcamento FOR INSERT TO anon, authenticated WITH CHECK (status = 'Pendente');
CREATE POLICY "admin reads" ON public.solicitacoes_orcamento FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin updates" ON public.solicitacoes_orcamento FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin deletes" ON public.solicitacoes_orcamento FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "anyone submits" ON public.solicitacao_telas FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admin reads" ON public.solicitacao_telas FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "anyone submits" ON public.solicitacao_elementos FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admin reads" ON public.solicitacao_elementos FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));