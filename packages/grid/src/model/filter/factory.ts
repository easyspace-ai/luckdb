/**
 * Filter Factory
 * 根据字段类型创建对应的过滤器实例
 */

import type { Field } from '../field/Field';
import type { BaseFilter, IFilterConfig } from './BaseFilter';
import { TextFilter } from './TextFilter';
import { NumberFilter } from './NumberFilter';
import { BooleanFilter } from './BooleanFilter';
import { SelectFilter } from './SelectFilter';
import { DateFilter } from './DateFilter';
import { LinkFilter } from './LinkFilter';
import { UserFilter } from './UserFilter';
import { AttachmentFilter } from './AttachmentFilter';
import { RatingFilter } from './RatingFilter';

export function createFilterInstance(
  field: Field,
  config: IFilterConfig
): BaseFilter {
  switch (field.type) {
    case 'text':
    case 'longText':
    case 'email':
    case 'phone':
    case 'url':
      return new TextFilter(field, config);
    
    case 'number':
    case 'currency':
    case 'percent':
    case 'duration':
      return new NumberFilter(field, config);
    
    case 'boolean':
    case 'checkbox':
      return new BooleanFilter(field, config);
    
    case 'singleSelect':
    case 'multipleSelect':
      return new SelectFilter(field, config);
    
    case 'date':
    case 'dateTime':
    case 'createdTime':
    case 'lastModifiedTime':
      return new DateFilter(field, config);
    
    case 'link':
    case 'linkTo':
      return new LinkFilter(field, config);
    
    case 'user':
    case 'createdBy':
    case 'lastModifiedBy':
      return new UserFilter(field, config);
    
    case 'attachment':
      return new AttachmentFilter(field, config);
    
    case 'rating':
      return new RatingFilter(field, config);
    
    // Formula 和 Rollup 字段根据其返回类型创建过滤器
    case 'formula':
    case 'rollup':
      // 这里可以根据字段的 options.returnType 来决定使用哪个过滤器
      // 暂时默认使用文本过滤器
      return new TextFilter(field, config);
    
    default:
      // 默认使用文本过滤器
      return new TextFilter(field, config);
  }
}


