import { IsNotEmpty } from 'class-validator';
import { QueryParamsDto } from 'src/utils/queryParams.util';

export class GetMessageQueryParamsDto extends QueryParamsDto {
  @IsNotEmpty()
  chatPartnerId: string;
}
