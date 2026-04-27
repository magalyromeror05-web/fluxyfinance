ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS language varchar(10) NOT NULL DEFAULT 'pt-BR';