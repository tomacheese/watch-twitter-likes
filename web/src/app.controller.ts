import { Body, Controller, Get, Headers, Post, Res } from '@nestjs/common'
import { Response } from 'express'
import { AppService } from './app.service'
import { getConfig } from './config'
import { IsString } from 'class-validator'

export class AddTargetDTO {
  @IsString()
  name: string
  @IsString()
  userId: string
  @IsString()
  threadId: string
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  root(@Res() res: Response) {
    return res.render('index', {
      version: process.env.npm_package_version,
    })
  }

  @Get('images')
  async getImages() {
    return await this.appService.getImages()
  }

  @Post('target')
  async addTarget(
    @Headers('Authorization') auth: string,
    @Res() res: Response,
    @Body() body: AddTargetDTO,
  ) {
    const config = getConfig()
    if (config.auth === undefined) {
      return res.status(404).send()
    }
    if (auth !== config.auth) {
      return res.status(401).send()
    }
    return await this.appService.addTarget(
      body.name,
      body.userId,
      body.threadId,
    )
  }
}
