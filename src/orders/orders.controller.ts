import { Controller, NotImplementedException, ParseUUIDPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderPaginationDto } from './dto/order-pagination.dto';
import { ChangeOrderStatusDto } from './dto';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern('createOrder')
  create(@Payload() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @MessagePattern('findAllOrders')
  findAll( @Payload() orderPaginationDto: OrderPaginationDto ) {
    return this.ordersService.findAll(orderPaginationDto);
  }

  @MessagePattern('findOneOrder')
  async findOne(@Payload('id', ParseUUIDPipe) id: string) {
    return await this.ordersService.findOne(id);
  }

  @MessagePattern('changeOrderStatus')
  async changeOrderStatus(@Payload() changeOrderStatusDto: ChangeOrderStatusDto) {
    return await this.ordersService.changeStatus(changeOrderStatusDto);
  }
}
