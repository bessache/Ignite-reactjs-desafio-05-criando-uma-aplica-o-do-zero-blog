import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

export const dateFormat = (date: Date): string => {
  return format(date, 'dd MMM yyyy', { locale: ptBR });
};

export const parsePtBrDate = (date: string, isDefault = true): string => {
  const style = isDefault ? 'd MMM yyyy' : "d MMM yyyy', às 'HH:mm";

  if (!date) {
    return '';
  }

  return format(new Date(date), style, {
    locale: ptBR,
  });
};
