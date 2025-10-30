import { IsOptional, IsString } from 'class-validator';
import { QueryParamsDto } from 'src/utils/queryParams.util';

export class userQueryParamsDto extends QueryParamsDto {
  @IsOptional()
  @IsString()
  name?: string;
}
