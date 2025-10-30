import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  @MinLength(6)
  newPassword: string;
}

export class UpdatePasswordDto {
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @IsNotEmpty()
  @MinLength(6)
  @IsString()
  newPassword: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  confirmPassword: string;
}
