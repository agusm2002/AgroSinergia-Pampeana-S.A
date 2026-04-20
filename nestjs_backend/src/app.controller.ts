import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AppService } from './app.service';
import type { ListQueryDto } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getApiInfo() {
    return {
      service: 'AgroSinergia API',
      version: '1.0.0',
      status: 'ok',
    };
  }

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('dashboard/summary')
  getDashboardSummary() {
    return this.appService.getDashboardSummary();
  }

  @Get('dashboard/upcoming-tasks')
  getUpcomingTasks() {
    return this.appService.getUpcomingTasks();
  }

  @Get('fields')
  async listFields(
    @Query() query: ListQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.appService.listFields(query);
    res.setHeader('x-total-count', String(result.total));
    return result.data;
  }

  @Get('fields/:id')
  getField(@Param('id', ParseIntPipe) id: number) {
    return this.appService.getField(id);
  }

  @Post('fields')
  createField(@Body() payload: Record<string, unknown>) {
    return this.appService.createField(payload);
  }

  @Patch('fields/:id')
  updateField(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: Record<string, unknown>,
  ) {
    return this.appService.updateField(id, payload);
  }

  @Delete('fields/:id')
  deleteField(@Param('id', ParseIntPipe) id: number) {
    return this.appService.deleteField(id);
  }

  @Get('campaigns')
  async listCampaigns(
    @Query() query: ListQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.appService.listCampaigns(query);
    res.setHeader('x-total-count', String(result.total));
    return result.data;
  }

  @Get('campaigns/:id')
  getCampaign(@Param('id', ParseIntPipe) id: number) {
    return this.appService.getCampaign(id);
  }

  @Post('campaigns')
  createCampaign(@Body() payload: Record<string, unknown>) {
    return this.appService.createCampaign(payload);
  }

  @Patch('campaigns/:id')
  updateCampaign(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: Record<string, unknown>,
  ) {
    return this.appService.updateCampaign(id, payload);
  }

  @Delete('campaigns/:id')
  deleteCampaign(@Param('id', ParseIntPipe) id: number) {
    return this.appService.deleteCampaign(id);
  }

  @Get('tasks')
  async listTasks(
    @Query() query: ListQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.appService.listTasks(query);
    res.setHeader('x-total-count', String(result.total));
    return result.data;
  }

  @Get('tasks/:id')
  getTask(@Param('id', ParseIntPipe) id: number) {
    return this.appService.getTask(id);
  }

  @Post('tasks')
  createTask(@Body() payload: Record<string, unknown>) {
    return this.appService.createTask(payload);
  }

  @Patch('tasks/:id')
  updateTask(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: Record<string, unknown>,
  ) {
    return this.appService.updateTask(id, payload);
  }

  @Delete('tasks/:id')
  deleteTask(@Param('id', ParseIntPipe) id: number) {
    return this.appService.deleteTask(id);
  }
}
