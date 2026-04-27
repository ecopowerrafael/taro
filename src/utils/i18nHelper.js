import i18n from '../i18n';

export function getTranslatedField(item, fieldName) {
  if (!item) return '';
  const lang = i18n.language?.slice(0, 2) || 'pt';
  const localizedField = `${fieldName}_${lang}`;
  return item[localizedField] || item[`${fieldName}_pt`] || item[fieldName] || '';
}
